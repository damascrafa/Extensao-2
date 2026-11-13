import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import FormField from '../components/FormField'
import { Alert } from '../components/Feedback'
import { registerSchema, fieldErrors } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { signUp } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const empty = { name: '', surname: '', birth_date: '', email: '', password: '', confirmPassword: '' }

export default function Register() {
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState(null)

  if (session && !pendingEmail) return <Navigate to="/painel" replace />

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp(parsed.data)
      if (needsEmailConfirmation) setPendingEmail(parsed.data.email)
      else navigate('/painel')
    } catch (err) {
      setServerError(friendlyError(err, 'Não foi possível criar a conta.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (pendingEmail)
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl">Confirme seu e-mail</h1>
        <p className="mt-4">
          Enviamos um link de confirmação para <strong>{pendingEmail}</strong>. Abra o e-mail, clique no link e depois
          entre na plataforma.
        </p>
        <Link to="/login" className="btn btn-primary mt-6">Ir para o login</Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">Crie sua conta gratuita</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" value={values.name} onChange={set('name')} error={errors.name} autoComplete="given-name" />
          <FormField label="Sobrenome" value={values.surname} onChange={set('surname')} error={errors.surname} autoComplete="family-name" />
        </div>
        <FormField label="Data de nascimento (opcional)" type="date" value={values.birth_date} onChange={set('birth_date')} error={errors.birth_date} autoComplete="bday" />
        <FormField label="E-mail" type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <FormField label="Senha" type="password" value={values.password} onChange={set('password')} error={errors.password} hint="Mínimo de 8 caracteres, com letras e números." autoComplete="new-password" />
        <FormField label="Confirme a senha" type="password" value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6 text-center">
        Já tem conta? <Link to="/login" className="link">Entrar</Link>
      </p>
    </div>
  )
}
