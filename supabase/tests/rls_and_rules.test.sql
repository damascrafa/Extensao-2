-- Rodar com: supabase test db   (requer pgTAP, já incluso no Supabase local)
-- Cenário: dois alunos (A e B), curso do seed 'informatica-basica'.
begin;
select plan(16);

-- usuários de teste (o trigger cria os perfis)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.dev', '{"name":"Ana","surname":"A"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.dev', '{"name":"Beto","surname":"B"}');

select is((select count(*)::int from public.profiles
           where id in ('aaaaaaaa-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002')),
          2, 'trigger cria o perfil no cadastro');

-- ===== como aluno A =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$select public.enroll_in_course((select id from public.courses where slug='informatica-basica'))$$,
  'A consegue se matricular');
select lives_ok(
  $$select public.enroll_in_course((select id from public.courses where slug='informatica-basica'))$$,
  'matrícula repetida é idempotente');
select is((select count(*)::int from public.enrollments), 1, 'A vê só a própria matrícula');

select lives_ok(
  $$select public.complete_lesson((select id from public.lessons order by created_at limit 1))$$,
  'A conclui uma aula');
select is((select count(*)::int from public.lesson_progress), 1, 'progresso registrado uma única vez');

-- A não pode forjar escrita direta
select throws_ok(
  $$insert into public.enrollments (student_id, course_id)
    select 'aaaaaaaa-0000-4000-8000-000000000001', id from public.courses limit 1$$,
  '42501', null, 'A não insere matrícula direto');
select throws_ok(
  $$update public.profiles set id = 'bbbbbbbb-0000-4000-8000-000000000002'$$,
  '42501', null, 'A não altera a coluna id do perfil');
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000001','admin')$$,
  '42501', null, 'A não se promove a admin');
select is((select count(*)::int from public.exam_answer_keys), 0, 'A não enxerga o gabarito');
select throws_ok(
  $$select public.issue_certificate((select id from public.courses where slug='informatica-basica'))$$,
  '42501', 'lessons_incomplete', 'certificado negado sem cumprir requisitos');
select throws_ok(
  $$select public.submit_exam((select id from public.final_exams limit 1), '{}'::jsonb)$$,
  '42501', 'lessons_incomplete', 'prova negada sem concluir as aulas');

-- ===== como aluno B =====
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is((select count(*)::int from public.enrollments), 0, 'B não vê matrícula de A');
select is((select count(*)::int from public.lesson_progress), 0, 'B não vê progresso de A');
select throws_ok(
  $$select public.complete_lesson((select id from public.lessons order by created_at limit 1))$$,
  '42501', 'not_enrolled', 'B sem matrícula não registra progresso');

-- ===== anônimo =====
set local role anon;
select is((select count(*)::int from public.courses), 1, 'visitante vê o catálogo de cursos ativos');

select * from finish();
rollback;
