import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import Logo from './Logo'
import { useAuthStore } from '../store/authStore'
import { useProfile } from '../hooks/queries'
import { signOut } from '../services/authService'

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 font-bold transition-colors hover:bg-brand-50 ${isActive ? 'text-brand-600' : 'text-ink'}`

export default function Navbar() {
  const session = useAuthStore((s) => s.session)
  const { data: profile } = useProfile()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    queryClient.clear()
    navigate('/')
  }

  const links = session ? (
    <>
      <NavLink to="/painel" className={linkCls} onClick={() => setOpen(false)}>Meu painel</NavLink>
      <NavLink to="/certificados" className={linkCls} onClick={() => setOpen(false)}>Certificados</NavLink>
      <NavLink to="/feedback" className={linkCls} onClick={() => setOpen(false)}>Feedback</NavLink>
      <button type="button" onClick={handleSignOut} className="btn btn-ghost">Sair</button>
    </>
  ) : (
    <>
      <NavLink to="/validar" className={linkCls} onClick={() => setOpen(false)}>Validar certificado</NavLink>
      <Link to="/login" className="btn btn-ghost" onClick={() => setOpen(false)}>Entrar</Link>
      <Link to="/cadastro" className="btn btn-primary" onClick={() => setOpen(false)}>Matrícula grátis</Link>
    </>
  )

  return (
    <header className="no-print sticky top-0 z-20 border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to={session ? '/painel' : '/'} aria-label="Primeiro Clique, página inicial">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-2 md:flex">
          {session && profile && <span className="mr-2 text-ink/70">Olá, {profile.name}</span>}
          {links}
        </nav>
        <button
          type="button"
          className="btn btn-ghost md:hidden"
          aria-expanded={open}
          aria-controls="menu-movel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Fechar' : 'Menu'}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-movel"
            aria-label="Principal (celular)"
            className="flex flex-col gap-2 overflow-hidden border-t border-brand-100 bg-white px-4 pb-4 pt-2 md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {links}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
