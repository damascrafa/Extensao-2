import { supabase, unwrap, appUrl } from '../lib/supabase'

export async function signUp({ email, password, name, surname, birth_date }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // O trigger do banco lê estes campos para criar o perfil.
      data: { name, surname, birth_date: birth_date || null },
      emailRedirectTo: `${appUrl}/login`,
    },
  })
  if (error) throw error
  // Com "Confirm email" ligado, não há sessão até o aluno confirmar o e-mail.
  return { needsEmailConfirmation: !data.session }
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/redefinir-senha`,
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function getProfile(userId) {
  return unwrap(
    await supabase.from('profiles').select('id,name,surname,birth_date,avatar_url').eq('id', userId).maybeSingle(),
  )
}

export async function updateProfile(userId, { name, surname, birth_date, avatar_url }) {
  return unwrap(
    await supabase
      .from('profiles')
      .update({ name, surname, birth_date, avatar_url })
      .eq('id', userId)
      .select()
      .single(),
  )
}
