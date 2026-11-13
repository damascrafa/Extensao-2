import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormField from '../components/FormField'
import { Alert } from '../components/Feedback'
import { resetPasswordSchema, fieldErrors } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { updatePassword } from '../services/authService'

// Rota protegida: o link do e-mail de recuperação abre uma sessão temporária.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const parsed = resetPasswordSchema.safeParse(values)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setSubmitting(true)
    try {
      await updatePassword(parsed.data.password)
      navigate('/painel', { replace: true })
    } catch (err) {
      setServerError(friendlyError(err, 'Não foi possível alterar a senha.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl">Crie uma nova senha</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <FormField label="Nova senha" type="password" value={values.password} onChange={set('password')} error={errors.password} hint="Mínimo de 8 caracteres, com letras e números." autoComplete="new-password" />
        <FormField label="Confirme a nova senha" type="password" value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
