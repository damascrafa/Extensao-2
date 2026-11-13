-- =====================================================================
-- 0001 · Schema base da plataforma de cursos
-- Regras gerais:
--   * UUID como PK, TIMESTAMPTZ para datas.
--   * Estrutura (módulos, aulas, questões) usa ON DELETE CASCADE.
--   * Histórico acadêmico (matrículas, progresso, tentativas, certificados)
--     usa ON DELETE RESTRICT: nada some por acidente.
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        varchar(100) not null check (length(trim(name)) > 0),
  surname     varchar(100) not null default '',
  birth_date  date,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- user_roles (permissões administrativas; só service_role/SQL escreve)
-- ---------------------------------------------------------------------
create table public.user_roles (
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        varchar(30) not null check (role in ('admin')),
  created_at  timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------
create table public.courses (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(150) not null,
  slug              varchar(180) not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description       text not null default '',
  teacher           varchar(150),
  duration_minutes  integer not null default 0 check (duration_minutes >= 0),
  image_url         text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- modules
-- ---------------------------------------------------------------------
create table public.modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        varchar(150) not null,
  description  text not null default '',
  order_index  integer not null check (order_index >= 0),
  created_at   timestamptz not null default now(),
  constraint modules_course_order_uq unique (course_id, order_index)
    deferrable initially deferred
);
create index idx_modules_course on public.modules (course_id);

-- ---------------------------------------------------------------------
-- lessons
-- content_path aponta para o componente em src/courses/<content_path>
-- ---------------------------------------------------------------------
create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules (id) on delete cascade,
  title             varchar(150) not null,
  description       text not null default '',
  content_path      text not null
                      check (content_path ~ '^[a-z0-9][a-z0-9/_-]*$'
                             and content_path !~ '\.\.'),
  duration_minutes  integer not null default 0 check (duration_minutes >= 0),
  order_index       integer not null check (order_index >= 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  constraint lessons_module_order_uq unique (module_id, order_index)
    deferrable initially deferred
);
create index idx_lessons_module on public.lessons (module_id);

-- ---------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------
create table public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles (id) on delete restrict,
  course_id     uuid not null references public.courses (id) on delete restrict,
  status        varchar(20) not null default 'active'
                  check (status in ('active', 'completed', 'cancelled')),
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  constraint enrollments_student_course_uq unique (student_id, course_id),
  constraint enrollments_completed_chk
    check ((status = 'completed') = (completed_at is not null))
);
create index idx_enrollments_course on public.enrollments (course_id);

-- ---------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------
create table public.lesson_progress (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles (id) on delete restrict,
  lesson_id         uuid not null references public.lessons (id) on delete restrict,
  completed         boolean not null default false,
  last_accessed_at  timestamptz not null default now(),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint lesson_progress_student_lesson_uq unique (student_id, lesson_id),
  constraint lesson_progress_completed_chk
    check (not completed or completed_at is not null)
);
create index idx_lesson_progress_lesson on public.lesson_progress (lesson_id);
create index idx_lesson_progress_student_access
  on public.lesson_progress (student_id, last_accessed_at desc);
create trigger trg_lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- exercises / exercise_attempts (formativos: não valem nota oficial)
-- ---------------------------------------------------------------------
create table public.exercises (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references public.lessons (id) on delete cascade,
  title          varchar(150) not null,
  description    text not null default '',
  exercise_type  varchar(50) not null default 'interactive'
                   check (exercise_type in
                     ('multiple_choice', 'interactive', 'drag_drop', 'fill_blank', 'other')),
  order_index    integer not null default 0 check (order_index >= 0),
  is_active      boolean not null default true
);
create index idx_exercises_lesson on public.exercises (lesson_id);

create table public.exercise_attempts (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references public.exercises (id) on delete restrict,
  student_id    uuid not null references public.profiles (id) on delete restrict,
  answer        jsonb,
  score         numeric(5,2) check (score between 0 and 100),
  is_correct    boolean,
  attempted_at  timestamptz not null default now()
);
create index idx_exercise_attempts_student_ex
  on public.exercise_attempts (student_id, exercise_id, attempted_at desc);

-- ---------------------------------------------------------------------
-- final_exams + questões + gabarito (gabarito em tabela separada,
-- sem nenhuma policy para alunos)
-- ---------------------------------------------------------------------
create table public.final_exams (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete restrict,
  title          varchar(150) not null,
  passing_score  numeric(5,2) not null default 70
                   check (passing_score between 0 and 100),
  max_attempts   integer not null default 3 check (max_attempts > 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index idx_final_exams_course on public.final_exams (course_id);
-- no máximo uma avaliação ativa por curso
create unique index uq_final_exams_one_active_per_course
  on public.final_exams (course_id) where is_active;

create table public.exam_questions (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.final_exams (id) on delete cascade,
  statement    text not null,
  points       numeric(6,2) not null default 1 check (points > 0),
  order_index  integer not null default 0 check (order_index >= 0)
);
create index idx_exam_questions_exam on public.exam_questions (exam_id);

create table public.exam_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.exam_questions (id) on delete cascade,
  label        text not null,
  order_index  integer not null default 0 check (order_index >= 0),
  constraint exam_options_id_question_uq unique (id, question_id)
);
create index idx_exam_options_question on public.exam_options (question_id);

create table public.exam_answer_keys (
  question_id  uuid primary key references public.exam_questions (id) on delete cascade,
  option_id    uuid not null,
  -- garante que a alternativa correta pertence à própria questão
  constraint exam_answer_keys_option_fk
    foreign key (option_id, question_id)
    references public.exam_options (id, question_id) on delete cascade
);

create table public.exam_attempts (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references public.final_exams (id) on delete restrict,
  student_id      uuid not null references public.profiles (id) on delete restrict,
  attempt_number  integer not null check (attempt_number > 0),
  answers         jsonb not null,
  score           numeric(5,2) not null check (score between 0 and 100),
  approved        boolean not null,
  attempted_at    timestamptz not null default now(),
  constraint exam_attempts_unique_number unique (exam_id, student_id, attempt_number)
);
create index idx_exam_attempts_student on public.exam_attempts (student_id, exam_id);

-- ---------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------
create table public.certificates (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles (id) on delete restrict,
  course_id         uuid not null references public.courses (id) on delete restrict,
  enrollment_id     uuid not null unique references public.enrollments (id) on delete restrict,
  certificate_code  uuid not null unique default gen_random_uuid(),
  -- snapshots: o certificado não muda se o perfil/curso forem renomeados
  student_name      varchar(250) not null,
  course_name       varchar(150) not null,
  issued_at         timestamptz not null default now(),
  constraint certificates_student_course_uq unique (student_id, course_id)
);
create index idx_certificates_course on public.certificates (course_id);

-- ---------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------
create table public.feedback (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references public.profiles (id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  message     text not null default '' check (length(message) <= 2000),
  is_public   boolean not null default false,  -- só admin altera (moderação)
  created_at  timestamptz not null default now()
);
create index idx_feedback_student on public.feedback (student_id);
create index idx_feedback_public on public.feedback (created_at desc) where is_public;
