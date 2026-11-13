import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField'
import { Alert } from '../components/Feedback'
import { emailSchema, fieldErrors } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { requestPasswordReset } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const parsed = emailSchema.safeParse({ email })
    if (!parsed.success) return setError(fieldErrors(parsed.error).email)
    setError('')
    setSubmitting(true)
    try {
      await requestPasswordReset(parsed.data.email)
      setSent(true)
    } catch (err) {
      setServerError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">Recuperar senha</h1>
      {sent ? (
        <div className="mt-6 space-y-4">
          <Alert type="success">Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.</Alert>
          <Link to="/login" className="link">Voltar para o login</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {serverError && <Alert type="error">{serverError}</Alert>}
          <FormField label="E-mail da sua conta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" />
          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
    </div>
  )
}
