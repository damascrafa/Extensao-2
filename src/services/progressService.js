import { supabase, unwrap } from '../lib/supabase'

export async function startLesson(lessonId) {
  return unwrap(await supabase.rpc('start_lesson', { p_lesson_id: lessonId }))
}

export async function completeLesson(lessonId) {
  return unwrap(await supabase.rpc('complete_lesson', { p_lesson_id: lessonId }))
}

// Progresso calculado pelo servidor: total, concluídas, %, última aula acessada.
export async function getMyProgress() {
  return unwrap(await supabase.rpc('get_my_progress'))
}

// Linhas de progresso do aluno (RLS: só as dele) para um conjunto de aulas.
export async function getLessonProgress(lessonIds) {
  if (!lessonIds.length) return []
  return unwrap(
    await supabase.from('lesson_progress').select('lesson_id,completed,last_accessed_at').in('lesson_id', lessonIds),
  )
}

export async function recordExerciseAttempt({ exerciseId, answer, score = null, isCorrect = null }) {
  return unwrap(
    await supabase.rpc('record_exercise_attempt', {
      p_exercise_id: exerciseId,
      p_answer: answer,
      p_score: score,
      p_is_correct: isCorrect,
    }),
  )
}
