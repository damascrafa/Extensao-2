-- =====================================================================
-- 0002 · Funções e regras de negócio (executam no servidor)
-- Todas SECURITY DEFINER com search_path vazio; a identidade vem SEMPRE
-- de auth.uid(), nunca de parâmetro enviado pelo cliente.
-- Erros de negócio usam mensagens curtas (ex.: 'not_enrolled') que o
-- frontend traduz.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Criação automática do perfil após o cadastro no Supabase Auth
-- Só lê nome/sobrenome/nascimento. Nunca lê papel/permissão do metadata.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_birth date;
begin
  begin
    v_birth := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    v_birth := null;
  end;

  insert into public.profiles (id, name, surname, birth_date)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Aluno'), 100),
    left(coalesce(trim(new.raw_user_meta_data ->> 'surname'), ''), 100),
    v_birth
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helpers de autorização
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_course_access(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.enrollments e
    where e.student_id = auth.uid()
      and e.course_id = p_course_id
      and e.status in ('active', 'completed')
  );
$$;

-- Helpers internos (não expostos ao cliente)
create or replace function public._course_lessons_completed(p_student uuid, p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with active_lessons as (
    select l.id
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where m.course_id = p_course and l.is_active
  )
  select
    (select count(*) from active_lessons) > 0
    and not exists (
      select 1 from active_lessons al
      where not exists (
        select 1 from public.lesson_progress lp
        where lp.lesson_id = al.id and lp.student_id = p_student and lp.completed
      )
    );
$$;

create or replace function public._exam_requirement_met(p_student uuid, p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not exists (select 1 from public.final_exams fe
                where fe.course_id = p_course and fe.is_active)
    or exists (select 1
               from public.exam_attempts ea
               join public.final_exams fe on fe.id = ea.exam_id
               where fe.course_id = p_course
                 and fe.is_active
                 and ea.student_id = p_student
                 and ea.approved);
$$;

create or replace function public._refresh_enrollment(p_student uuid, p_course uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public._course_lessons_completed(p_student, p_course)
     and public._exam_requirement_met(p_student, p_course) then
    update public.enrollments
       set status = 'completed',
           completed_at = coalesce(completed_at, now())
     where student_id = p_student
       and course_id = p_course
       and status = 'active';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Matrícula (idempotente)
-- ---------------------------------------------------------------------
create or replace function public.enroll_in_course(p_course_id uuid)
returns public.enrollments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_enr public.enrollments;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  if not exists (select 1 from public.courses where id = p_course_id and is_active) then
    raise exception 'course_not_available' using errcode = 'P0002';
  end if;

  insert into public.enrollments (student_id, course_id)
  values (v_uid, p_course_id)
  on conflict (student_id, course_id) do nothing
  returning * into v_enr;

  if v_enr.id is null then
    select * into v_enr from public.enrollments
     where student_id = v_uid and course_id = p_course_id;
    -- reativa matrícula cancelada
    if v_enr.status = 'cancelled' then
      update public.enrollments
         set status = 'active', completed_at = null
       where id = v_enr.id
      returning * into v_enr;
    end if;
  end if;

  return v_enr;
end;
$$;

-- ---------------------------------------------------------------------
-- Progresso (UPSERT idempotente)
-- ---------------------------------------------------------------------
create or replace function public._lesson_course(p_lesson_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id and l.is_active;
$$;

create or replace function public.start_lesson(p_lesson_id uuid)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_course uuid;
  v_row public.lesson_progress;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  v_course := public._lesson_course(p_lesson_id);
  if v_course is null then raise exception 'lesson_not_found' using errcode = 'P0002'; end if;

  if not exists (select 1 from public.enrollments
                  where student_id = v_uid and course_id = v_course
                    and status in ('active', 'completed')) then
    raise exception 'not_enrolled' using errcode = '42501';
  end if;

  insert into public.lesson_progress (student_id, lesson_id, last_accessed_at)
  values (v_uid, p_lesson_id, now())
  on conflict (student_id, lesson_id)
  do update set last_accessed_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.complete_lesson(p_lesson_id uuid)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_course uuid;
  v_row public.lesson_progress;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  v_course := public._lesson_course(p_lesson_id);
  if v_course is null then raise exception 'lesson_not_found' using errcode = 'P0002'; end if;

  if not exists (select 1 from public.enrollments
                  where student_id = v_uid and course_id = v_course
                    and status in ('active', 'completed')) then
    raise exception 'not_enrolled' using errcode = '42501';
  end if;

  insert into public.lesson_progress
    (student_id, lesson_id, completed, completed_at, last_accessed_at)
  values (v_uid, p_lesson_id, true, now(), now())
  on conflict (student_id, lesson_id)
  do update set completed = true,
                completed_at = coalesce(public.lesson_progress.completed_at, now()),
                last_accessed_at = now()
  returning * into v_row;

  perform public._refresh_enrollment(v_uid, v_course);
  return v_row;
end;
$$;

-- Progresso calculado sobre as aulas ativas (nunca uma % salva à mão)
create or replace function public.get_my_progress()
returns table (
  course_id         uuid,
  total_lessons     integer,
  completed_lessons integer,
  progress_percent  numeric,
  last_lesson_id    uuid,
  last_accessed_at  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.course_id,
    coalesce(t.total, 0)::integer,
    coalesce(c.done, 0)::integer,
    case when coalesce(t.total, 0) = 0 then 0
         else round(100.0 * coalesce(c.done, 0) / t.total, 1) end,
    l.lesson_id,
    l.last_accessed_at
  from public.enrollments e
  left join lateral (
    select count(*) as total
    from public.lessons ls
    join public.modules m on m.id = ls.module_id
    where m.course_id = e.course_id and ls.is_active
  ) t on true
  left join lateral (
    select count(*) as done
    from public.lesson_progress lp
    join public.lessons ls on ls.id = lp.lesson_id and ls.is_active
    join public.modules m on m.id = ls.module_id
    where m.course_id = e.course_id and lp.student_id = e.student_id and lp.completed
  ) c on true
  left join lateral (
    select lp.lesson_id, lp.last_accessed_at
    from public.lesson_progress lp
    join public.lessons ls on ls.id = lp.lesson_id and ls.is_active
    join public.modules m on m.id = ls.module_id
    where m.course_id = e.course_id and lp.student_id = e.student_id
    order by lp.last_accessed_at desc
    limit 1
  ) l on true
  where e.student_id = auth.uid()
    and e.status in ('active', 'completed');
$$;

-- ---------------------------------------------------------------------
-- Exercícios (FORMATIVOS): o resultado vem da lógica JS da aula no
-- navegador, logo NÃO é autoritativo e não entra em aprovação/certificado.
-- ---------------------------------------------------------------------
create or replace function public.record_exercise_attempt(
  p_exercise_id uuid,
  p_answer      jsonb,
  p_score       numeric default null,
  p_is_correct  boolean default null
)
returns public.exercise_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_course uuid;
  v_row public.exercise_attempts;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select m.course_id into v_course
  from public.exercises x
  join public.lessons l on l.id = x.lesson_id and l.is_active
  join public.modules m on m.id = l.module_id
  where x.id = p_exercise_id and x.is_active;

  if v_course is null then raise exception 'exercise_not_found' using errcode = 'P0002'; end if;

  if not exists (select 1 from public.enrollments
                  where student_id = v_uid and course_id = v_course
                    and status in ('active', 'completed')) then
    raise exception 'not_enrolled' using errcode = '42501';
  end if;

  if p_answer is not null and pg_column_size(p_answer) > 20000 then
    raise exception 'answer_too_large' using errcode = '22023';
  end if;

  insert into public.exercise_attempts (exercise_id, student_id, answer, score, is_correct)
  values (p_exercise_id, v_uid, p_answer, p_score, p_is_correct)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Avaliação final: correção 100% no servidor.
-- p_answers = {"<question_id>": "<option_id>", ...}
-- ---------------------------------------------------------------------
create or replace function public.submit_exam(p_exam_id uuid, p_answers jsonb)
returns table (
  attempt_id    uuid,
  attempt_no    integer,
  final_score   numeric,
  is_approved   boolean,
  attempts_left integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_exam    public.final_exams;
  v_used    integer;
  v_earned  numeric;
  v_total   numeric;
  v_score   numeric(5,2);
  v_ok      boolean;
  v_attempt public.exam_attempts;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object'
     or pg_column_size(p_answers) > 50000 then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  select * into v_exam from public.final_exams where id = p_exam_id and is_active;
  if not found then raise exception 'exam_not_found' using errcode = 'P0002'; end if;

  -- serializa tentativas do mesmo aluno neste curso (evita corrida no limite)
  perform 1 from public.enrollments
   where student_id = v_uid and course_id = v_exam.course_id
     and status in ('active', 'completed')
   for update;
  if not found then raise exception 'not_enrolled' using errcode = '42501'; end if;

  if not public._course_lessons_completed(v_uid, v_exam.course_id) then
    raise exception 'lessons_incomplete' using errcode = '42501';
  end if;

  if exists (select 1 from public.exam_attempts
              where exam_id = p_exam_id and student_id = v_uid and approved) then
    raise exception 'already_approved' using errcode = '42501';
  end if;

  select count(*) into v_used from public.exam_attempts
   where exam_id = p_exam_id and student_id = v_uid;
  if v_used >= v_exam.max_attempts then
    raise exception 'max_attempts_reached' using errcode = '42501';
  end if;

  if exists (select 1
               from public.exam_questions q
               left join public.exam_answer_keys k on k.question_id = q.id
              where q.exam_id = p_exam_id and k.question_id is null) then
    raise exception 'exam_misconfigured' using errcode = 'P0001';
  end if;

  select coalesce(sum(q.points) filter (
           where (p_answers ->> q.id::text) = k.option_id::text), 0),
         coalesce(sum(q.points), 0)
    into v_earned, v_total
    from public.exam_questions q
    join public.exam_answer_keys k on k.question_id = q.id
   where q.exam_id = p_exam_id;

  if v_total = 0 then raise exception 'exam_misconfigured' using errcode = 'P0001'; end if;

  v_score := round(100 * v_earned / v_total, 2);
  v_ok := v_score >= v_exam.passing_score;

  insert into public.exam_attempts (exam_id, student_id, attempt_number, answers, score, approved)
  values (p_exam_id, v_uid, v_used + 1, p_answers, v_score, v_ok)
  returning * into v_attempt;

  perform public._refresh_enrollment(v_uid, v_exam.course_id);

  return query select v_attempt.id, v_attempt.attempt_number, v_attempt.score,
                      v_attempt.approved, v_exam.max_attempts - v_attempt.attempt_number;
end;
$$;

-- ---------------------------------------------------------------------
-- Certificados
-- ---------------------------------------------------------------------
create or replace function public.issue_certificate(p_course_id uuid)
returns public.certificates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_enr  public.enrollments;
  v_cert public.certificates;
  v_name text;
  v_course text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select * into v_enr from public.enrollments
   where student_id = v_uid and course_id = p_course_id
     and status in ('active', 'completed')
   for update;
  if not found then raise exception 'not_enrolled' using errcode = '42501'; end if;

  if not public._course_lessons_completed(v_uid, p_course_id) then
    raise exception 'lessons_incomplete' using errcode = '42501';
  end if;
  if not public._exam_requirement_met(v_uid, p_course_id) then
    raise exception 'exam_not_passed' using errcode = '42501';
  end if;

  select trim(p.name || ' ' || p.surname) into v_name
    from public.profiles p where p.id = v_uid;
  select c.name into v_course from public.courses c where c.id = p_course_id;

  insert into public.certificates
    (student_id, course_id, enrollment_id, student_name, course_name)
  values (v_uid, p_course_id, v_enr.id, v_name, v_course)
  on conflict (student_id, course_id) do nothing
  returning * into v_cert;

  if v_cert.id is null then
    select * into v_cert from public.certificates
     where student_id = v_uid and course_id = p_course_id;
  end if;

  perform public._refresh_enrollment(v_uid, p_course_id);
  return v_cert;
end;
$$;

-- Validação pública: devolve só o mínimo necessário
create or replace function public.verify_certificate(p_code uuid)
returns table (holder_name text, course_title text, issued_on timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.student_name::text, c.course_name::text, c.issued_at
  from public.certificates c
  where c.certificate_code = p_code;
$$;

-- ---------------------------------------------------------------------
-- Feedbacks públicos (somente os moderados; só primeiro nome)
-- ---------------------------------------------------------------------
create or replace view public.public_feedbacks as
  select f.id,
         f.rating,
         f.message,
         f.created_at,
         coalesce(split_part(p.name, ' ', 1), 'Aluno') as author_first_name
  from public.feedback f
  left join public.profiles p on p.id = f.student_id
  where f.is_public and length(trim(f.message)) > 0;
