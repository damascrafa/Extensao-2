import { create } from 'zustand'
import { supabase } from '../lib/supabase'

let started = false

// Guarda só a sessão. O perfil vem do TanStack Query (useProfile).
export const useAuthStore = create((set) => ({
  session: null,
  initialized: false,
  init: () => {
    if (started || !supabase) return
    started = true
    supabase.auth.getSession().then(({ data }) => set({ session: data.session, initialized: true }))
    // Callback síncrono: não faça chamadas ao Supabase aqui dentro.
    supabase.auth.onAuthStateChange((_event, session) => set({ session, initialized: true }))
  },
}))
