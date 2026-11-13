import { supabase, unwrap } from '../lib/supabase'

// Questões e alternativas, sem gabarito (o aluno não tem acesso à tabela de gabarito).
export async function getExamForCourse(courseId) {
  return unwrap(
    await supabase
      .from('final_exams')
      .select(
        'id,title,passing_score,max_attempts,' +
          'exam_questions(id,statement,points,order_index,exam_options(id,label,order_index))',
      )
      .eq('course_id', courseId)
      .eq('is_active', true)
      .maybeSingle(),
  )
}

export async function listMyAttempts(examId) {
  return unwrap(
    await supabase
      .from('exam_attempts')
      .select('id,attempt_number,score,approved,attempted_at')
      .eq('exam_id', examId)
      .order('attempt_number'),
  )
}

// answers = { [questionId]: optionId }. A correção acontece no banco.
export async function submitExam(examId, answers) {
  const rows = unwrap(await supabase.rpc('submit_exam', { p_exam_id: examId, p_answers: answers }))
  return Array.isArray(rows) ? rows[0] : rows
}
