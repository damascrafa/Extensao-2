import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import FormField from '../components/FormField'
import { Alert } from '../components/Feedback'
import { loginSchema, fieldErrors } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { signIn } from '../services/authService'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from || '/painel'
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to={destination} replace />

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setSubmitting(true)
    try {
      await signIn(parsed.data)
      navigate(destination, { replace: true })
    } catch (err) {
      setServerError(friendlyError(err, 'Não foi possível entrar.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">Entrar</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <FormField label="E-mail" type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <FormField label="Senha" type="password" value={values.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center"><Link to="/esqueci-senha" className="link">Esqueci minha senha</Link></p>
      <p className="mt-2 text-center">Ainda não tem conta? <Link to="/cadastro" className="link">Matrícula grátis</Link></p>
    </div>
  )
}
