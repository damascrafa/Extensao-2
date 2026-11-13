import { supabase, unwrap } from '../lib/supabase'

// A matrícula é criada no servidor (RPC idempotente). O cliente não insere direto na tabela.
export async function enroll(courseId) {
  return unwrap(await supabase.rpc('enroll_in_course', { p_course_id: courseId }))
}

export async function listMyEnrollments() {
  return unwrap(
    await supabase.from('enrollments').select('id,course_id,status,enrolled_at,completed_at').order('enrolled_at'),
  )
}
