-- =====================================================================
-- Seed de DESENVOLVIMENTO (supabase db reset). Não rodar em produção
-- sem revisar. Baseado no esboço do README (Informática Básica, 7 módulos).
-- Ajuste títulos, durações e content_path conforme os conteúdos reais.
-- =====================================================================
do $$
declare
  v_course uuid;
  v_mod    uuid;
  v_exam   uuid;
  v_q      uuid;
  v_ok     uuid;
  v_titles text[] := array[
    'Conhecendo o computador', 'Teclado e mouse', 'Arquivos e pastas',
    'Internet', 'E-mail', 'Segurança digital', 'Aplicativos básicos'];
  i integer;
begin
  insert into public.courses (name, slug, description, teacher, duration_minutes, is_active)
  values ('Informática Básica', 'informatica-basica',
          'Primeiros passos no computador: do mouse à segurança digital.',
          'Equipe Primeiro Clique', 21, true)
  on conflict (slug) do nothing
  returning id into v_course;

  if v_course is null then
    return; -- seed já aplicado
  end if;

  for i in 1 .. array_length(v_titles, 1) loop
    insert into public.modules (course_id, title, description, order_index)
    values (v_course, v_titles[i], 'Módulo ' || i, i)
    returning id into v_mod;

    -- uma aula placeholder por módulo (vídeos/aulas de até 3 min no esboço)
    insert into public.lessons (module_id, title, description, content_path, duration_minutes, order_index)
    values (v_mod, 'Aula 1 · ' || v_titles[i], '',
            'informatica-basica/modulo-' || lpad(i::text, 2, '0') || '/aula-01', 3, 1);
  end loop;

  -- Prova de EXEMPLO (substituir pelas questões reais)
  insert into public.final_exams (course_id, title, passing_score, max_attempts)
  values (v_course, 'Avaliação final · Informática Básica', 70, 3)
  returning id into v_exam;

  insert into public.exam_questions (exam_id, statement, order_index)
  values (v_exam, '[EXEMPLO] Qual dispositivo é usado para digitar texto?', 1)
  returning id into v_q;
  insert into public.exam_options (question_id, label, order_index) values
    (v_q, 'Mouse', 1), (v_q, 'Monitor', 2);
  insert into public.exam_options (question_id, label, order_index)
  values (v_q, 'Teclado', 3) returning id into v_ok;
  insert into public.exam_answer_keys (question_id, option_id) values (v_q, v_ok);

  insert into public.exam_questions (exam_id, statement, order_index)
  values (v_exam, '[EXEMPLO] Qual é uma boa prática de segurança digital?', 2)
  returning id into v_q;
  insert into public.exam_options (question_id, label, order_index) values
    (v_q, 'Usar a mesma senha em todos os sites', 1),
    (v_q, 'Compartilhar a senha por mensagem', 2);
  insert into public.exam_options (question_id, label, order_index)
  values (v_q, 'Usar senhas longas e diferentes', 3) returning id into v_ok;
  insert into public.exam_answer_keys (question_id, option_id) values (v_q, v_ok);
end;
$$;
