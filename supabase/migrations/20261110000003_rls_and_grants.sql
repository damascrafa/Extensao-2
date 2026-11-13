-- =====================================================================
-- 0003 · Segurança: RLS + privilégios mínimos
-- Estratégia em duas camadas:
--   1) GRANT: começa sem nada e libera só o necessário (por coluna quando preciso).
--   2) RLS: restringe quais LINHAS cada papel enxerga/altera.
-- Escritas sensíveis (matrícula, progresso, tentativas, certificados) NÃO têm
-- policy de INSERT/UPDATE para alunos: passam só pelas RPCs SECURITY DEFINER.
-- =====================================================================

-- Zera os privilégios padrão do Supabase nas tabelas e funções do schema public
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Habilita RLS em todas as tabelas
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.courses           enable row level security;
alter table public.modules           enable row level security;
alter table public.lessons           enable row level security;
alter table public.enrollments       enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.exercises         enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.final_exams       enable row level security;
alter table public.exam_questions    enable row level security;
alter table public.exam_options      enable row level security;
alter table public.exam_answer_keys  enable row level security;
alter table public.exam_attempts     enable row level security;
alter table public.certificates      enable row level security;
alter table public.feedback          enable row level security;

-- ---------------------------------------------------------------------
-- GRANTS de tabela
-- ---------------------------------------------------------------------
-- Catálogo público (visitantes)
grant select on public.courses, public.modules, public.lessons to anon;
grant select on public.public_feedbacks to anon, authenticated;

-- Usuário autenticado: leitura (as policies filtram as linhas)
grant select on
  public.profiles, public.user_roles, public.courses, public.modules, public.lessons,
  public.enrollments, public.lesson_progress, public.exercises, public.exercise_attempts,
  public.final_exams, public.exam_questions, public.exam_options, public.exam_attempts,
  public.certificates, public.feedback
to authenticated;

-- Perfil: o aluno só altera estas colunas (nunca id/created_at)
grant update (name, surname, birth_date, avatar_url) on public.profiles to authenticated;

-- Feedback: o aluno só informa estas colunas (is_public fica false)
grant insert (student_id, rating, message) on public.feedback to authenticated;

-- Admin escreve via RLS (is_admin()); o privilégio abaixo sozinho não basta
grant insert, update, delete on
  public.courses, public.modules, public.lessons, public.exercises,
  public.final_exams, public.exam_questions, public.exam_options
to authenticated;
grant select, insert, update, delete on public.exam_answer_keys to authenticated;
grant update, delete on public.feedback to authenticated;

-- ---------------------------------------------------------------------
-- Execução de funções
-- ---------------------------------------------------------------------
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

grant execute on function
  public.is_admin(),
  public.has_course_access(uuid),
  public.enroll_in_course(uuid),
  public.start_lesson(uuid),
  public.complete_lesson(uuid),
  public.get_my_progress(),
  public.record_exercise_attempt(uuid, jsonb, numeric, boolean),
  public.submit_exam(uuid, jsonb),
  public.issue_certificate(uuid)
to authenticated;
-- Funções com prefixo "_" e handle_new_user/set_updated_at: sem EXECUTE para clientes.

-- ---------------------------------------------------------------------
-- POLICIES
-- ---------------------------------------------------------------------

-- profiles ------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: o usuário só vê o próprio papel; ninguém escreve pelo cliente
create policy user_roles_select_own on public.user_roles
  for select to authenticated using (user_id = auth.uid());

-- catálogo ------------------------------------------------------------
create policy courses_select_public on public.courses
  for select to anon, authenticated using (is_active);
create policy courses_admin_all on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy modules_select_public on public.modules
  for select to anon, authenticated
  using (exists (select 1 from public.courses c
                  where c.id = modules.course_id and c.is_active));
create policy modules_admin_all on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy lessons_select_public on public.lessons
  for select to anon, authenticated using (is_active);
create policy lessons_admin_all on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- enrollments (somente leitura; criação via enroll_in_course) ----------
create policy enrollments_select_own on public.enrollments
  for select to authenticated using (student_id = auth.uid());
create policy enrollments_select_admin on public.enrollments
  for select to authenticated using (public.is_admin());

-- lesson_progress (somente leitura; escrita via RPC) --------------------
create policy lesson_progress_select_own on public.lesson_progress
  for select to authenticated using (student_id = auth.uid());
create policy lesson_progress_select_admin on public.lesson_progress
  for select to authenticated using (public.is_admin());

-- exercises -----------------------------------------------------------
create policy exercises_select_enrolled on public.exercises
  for select to authenticated
  using (is_active and exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    where l.id = exercises.lesson_id
      and public.has_course_access(m.course_id)));
create policy exercises_admin_all on public.exercises
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy exercise_attempts_select_own on public.exercise_attempts
  for select to authenticated using (student_id = auth.uid());
create policy exercise_attempts_select_admin on public.exercise_attempts
  for select to authenticated using (public.is_admin());

-- provas --------------------------------------------------------------
create policy final_exams_select_enrolled on public.final_exams
  for select to authenticated
  using (is_active and public.has_course_access(course_id));
create policy final_exams_admin_all on public.final_exams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy exam_questions_select_enrolled on public.exam_questions
  for select to authenticated
  using (exists (select 1 from public.final_exams fe
                  where fe.id = exam_questions.exam_id
                    and fe.is_active
                    and public.has_course_access(fe.course_id)));
create policy exam_questions_admin_all on public.exam_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy exam_options_select_enrolled on public.exam_options
  for select to authenticated
  using (exists (select 1
                   from public.exam_questions q
                   join public.final_exams fe on fe.id = q.exam_id
                  where q.id = exam_options.question_id
                    and fe.is_active
                    and public.has_course_access(fe.course_id)));
create policy exam_options_admin_all on public.exam_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- gabarito: SOMENTE admin (alunos não têm policy → 0 linhas)
create policy exam_answer_keys_admin_all on public.exam_answer_keys
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy exam_attempts_select_own on public.exam_attempts
  for select to authenticated using (student_id = auth.uid());
create policy exam_attempts_select_admin on public.exam_attempts
  for select to authenticated using (public.is_admin());

-- certificates (somente leitura; emissão via issue_certificate) ---------
create policy certificates_select_own on public.certificates
  for select to authenticated using (student_id = auth.uid());
create policy certificates_select_admin on public.certificates
  for select to authenticated using (public.is_admin());

-- feedback ------------------------------------------------------------
create policy feedback_insert_own on public.feedback
  for insert to authenticated
  with check (student_id = auth.uid() and is_public = false);
create policy feedback_select_own on public.feedback
  for select to authenticated using (student_id = auth.uid());
create policy feedback_admin_all on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
