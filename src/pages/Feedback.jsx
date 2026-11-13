import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import FormField from '../components/FormField'
import { Alert } from '../components/Feedback'
import { feedbackSchema, fieldErrors } from '../lib/schemas'
import { friendlyError } from '../lib/errors'
import { submitFeedback } from '../services/feedbackService'

export default function Feedback() {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      setSent(true)
      setRating('')
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    },
  })

  function onSubmit(e) {
    e.preventDefault()
    setSent(false)
    const parsed = feedbackSchema.safeParse({ rating, message })
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    mutation.mutate(parsed.data)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl">Como está sendo sua experiência?</h1>
      <p className="mt-2 text-ink/75">Sua opinião ajuda a melhorar os cursos. Sugestões e críticas são bem-vindas.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {sent && <Alert type="success">Feedback enviado. Obrigado!</Alert>}
        {mutation.error && <Alert type="error">{friendlyError(mutation.error, 'Não foi possível enviar.')}</Alert>}
        <fieldset>
          <legend className="mb-2 font-bold">Sua nota</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`btn cursor-pointer ${String(n) === String(rating) ? 'btn-primary' : 'btn-ghost'}`}>
                <input type="radio" name="rating" value={n} checked={String(n) === String(rating)} onChange={() => setRating(String(n))} className="sr-only" />
                {n} {n === 1 ? 'estrela' : 'estrelas'}
              </label>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-sm font-bold text-danger">{errors.rating}</p>}
        </fieldset>
        <FormField as="textarea" rows={5} label="Mensagem, sugestões ou comentários" value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} />
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando…' : 'Enviar feedback'}
        </button>
      </form>
    </div>
  )
}
