import { supabase, unwrap } from '../lib/supabase'

export async function submitFeedback({ rating, message }) {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!userId) throw new Error('not_authenticated')
  // O banco só aceita student_id = usuário logado e is_public = false (RLS).
  unwrap(await supabase.from('feedback').insert({ student_id: userId, rating, message }))
}

// Somente feedbacks aprovados pela moderação (view com primeiro nome).
export async function listPublicFeedbacks(limit = 6) {
  return unwrap(
    await supabase
      .from('public_feedbacks')
      .select('id,rating,message,created_at,author_first_name')
      .order('created_at', { ascending: false })
      .limit(limit),
  )
}
