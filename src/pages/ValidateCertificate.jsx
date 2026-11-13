import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import FormField from '../components/FormField'
import { Alert, Spinner } from '../components/Feedback'
import { certificateCodeSchema } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { verifyCertificate } from '../services/certificateService'

// Página pública: qualquer pessoa pode conferir um certificado pelo código.
export default function ValidateCertificate() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [value, setValue] = useState(code ?? '')
  const [formError, setFormError] = useState('')
  const valid = code ? certificateCodeSchema.safeParse(code) : null
  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', code],
    queryFn: () => verifyCertificate(code),
    enabled: !!valid?.success,
  })

  function onSubmit(e) {
    e.preventDefault()
    const parsed = certificateCodeSchema.safeParse(value)
    if (!parsed.success) return setFormError(parsed.error.issues[0].message)
    setFormError('')
    navigate(`/validar/${parsed.data}`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl">Validar certificado</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <FormField label="Código do certificado" value={value} onChange={(e) => setValue(e.target.value)} error={formError} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        <button type="submit" className="btn btn-primary">Verificar</button>
      </form>
      <div className="mt-8" aria-live="polite">
        {valid && !valid.success && <Alert type="error">Código inválido.</Alert>}
        {valid?.success && isLoading && <Spinner label="Verificando…" />}
        {error && <Alert type="error">{friendlyError(error)}</Alert>}
        {valid?.success && !isLoading && !error && (data ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-leaf">
            <p className="text-lg font-bold">Certificado autêntico</p>
            <p className="mt-2 text-ink"><strong>{data.holder_name}</strong> concluiu o curso <strong>{data.course_title}</strong> em {new Date(data.issued_on).toLocaleDateString('pt-BR')}.</p>
          </div>
        ) : (
          <Alert type="error">Nenhum certificado encontrado com este código.</Alert>
        ))}
      </div>
    </div>
  )
}
