import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Somente a chave "anon" (pública) é usada aqui. Nunca use a service_role no frontend.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

// Lança o erro do Supabase (se houver) e devolve os dados.
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}
