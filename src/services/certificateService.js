import { supabase, unwrap } from '../lib/supabase'

export async function issueCertificate(courseId) {
  return unwrap(await supabase.rpc('issue_certificate', { p_course_id: courseId }))
}

export async function listMyCertificates() {
  return unwrap(
    await supabase
      .from('certificates')
      .select('id,course_id,certificate_code,student_name,course_name,issued_at')
      .order('issued_at', { ascending: false }),
  )
}

export async function getCertificate(id) {
  return unwrap(
    await supabase
      .from('certificates')
      .select('id,course_id,certificate_code,student_name,course_name,issued_at')
      .eq('id', id)
      .maybeSingle(),
  )
}

// Consulta pública: devolve só nome, curso e data (ou nada, se o código não existir).
export async function verifyCertificate(code) {
  const rows = unwrap(await supabase.rpc('verify_certificate', { p_code: code }))
  return rows?.[0] ?? null
}
