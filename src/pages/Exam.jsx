import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, ErrorState, Spinner } from '../components/Feedback'
import { keys, useAttempts, useCourse, useExam, useMyEnrollments, useMyProgress } from '../hooks/queries'
import { sortByOrder } from '../lib/progress'
import { friendlyError } from '../lib/errors'
import { submitExam } from '../services/examService'

export default function Exam() {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const courseQ = useCourse(slug)
  const enrollments = useMyEnrollments()
  const progress = useMyProgress()
  const course = courseQ.data
  const examQ = useExam(course?.id, true)
  const exam = examQ.data
  const attemptsQ = useAttempts(exam?.id)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const questions = useMemo(
    () => sortByOrder(exam?.exam_questions).map((q) => ({ ...q, exam_options: sortByOrder(q.exam_options) })),
    [exam],
  )

  const mutation = useMutation({
    mutationFn: () => submitExam(exam.id, answers),
    onSuccess: async (res) => {
      setResult(res)
      await Promise.all(
        [keys.attempts(exam.id), keys.enrollments, keys.progress].map((k) => queryClient.invalidateQueries({ queryKey: k })),
      )
    },
  })

  if (courseQ.isLoading || enrollments.isLoading || progress.isLoading || examQ.isLoading || (exam && attemptsQ.isLoading))
    return <Spinner label="Carregando avaliação…" />
  const failed = courseQ.error || enrollments.error || progress.error || examQ.error || attemptsQ.error
  if (failed) return <ErrorState error={failed} />
  if (!course) return <Navigate to="/painel" replace />
  if (!enrollments.data.some((e) => e.course_id === course.id)) return <Navigate to={`/cursos/${slug}`} replace />

  const back = <Link to={`/cursos/${slug}`} className="link">Voltar ao curso</Link>
  const courseProgress = progress.data.find((p) => p.course_id === course.id)
  const used = attemptsQ.data?.length ?? 0
  const approved = attemptsQ.data?.some((a) => a.approved)

  if (!exam)
    return <Shell title="Avaliação final"><p>Este curso não tem avaliação final.</p>{back}</Shell>
  if (!questions.length)
    return <Shell title={exam.title}><p>A avaliação ainda está sendo preparada.</p>{back}</Shell>
  if (!(courseProgress?.progress_percent >= 100))
    return <Shell title={exam.title}><Alert type="info">Conclua todas as aulas para liberar a avaliação.</Alert>{back}</Shell>
  if (approved && !result)
    return <Shell title={exam.title}><Alert type="success">Você já foi aprovado nesta avaliação.</Alert>{back}</Shell>
  if (!result && used >= exam.max_attempts)
    return <Shell title={exam.title}><Alert type="error">Você usou todas as {exam.max_attempts} tentativas.</Alert>{back}</Shell>

  if (result)
    return (
      <Shell title={exam.title}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-white p-6 ring-1 ring-brand-100">
          <p className="text-lg">Sua nota</p>
          <p className="font-display text-5xl font-extrabold">{Number(result.final_score).toFixed(0)}%</p>
          <p className={`mt-2 font-bold ${result.is_approved ? 'text-leaf' : 'text-danger'}`}>
            {result.is_approved ? 'Aprovado!' : `Não foi desta vez. A nota mínima é ${Number(exam.passing_score).toFixed(0)}%.`}
          </p>
          {result.is_approved ? (
            <Link to={`/cursos/${slug}`} className="btn btn-sun mt-5">Emitir meu certificado</Link>
          ) : result.attempts_left > 0 ? (
            <button type="button" className="btn btn-primary mt-5" onClick={() => { setResult(null); setAnswers({}) }}>
              Tentar de novo ({result.attempts_left} restante{result.attempts_left > 1 ? 's' : ''})
            </button>
          ) : (
            <p className="mt-3">Suas tentativas acabaram.</p>
          )}
        </motion.div>
        <div className="mt-4">{back}</div>
      </Shell>
    )

  const allAnswered = questions.every((q) => answers[q.id])

  return (
    <Shell title={exam.title}>
      <p className="mb-6 text-ink/75">
        Nota mínima: {Number(exam.passing_score).toFixed(0)}%. Tentativa {used + 1} de {exam.max_attempts}.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); if (allAnswered) mutation.mutate() }} className="space-y-6">
        {questions.map((q, i) => (
          <fieldset key={q.id} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
            <legend className="px-1 font-bold">{i + 1}. {q.statement}</legend>
            <div className="mt-2 space-y-2">
              {q.exam_options.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-brand-50">
                  <input
                    type="radio"
                    name={q.id}
                    value={o.id}
                    checked={answers[q.id] === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className="mt-1.5 h-4 w-4 accent-brand-500"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {mutation.error && <Alert type="error">{friendlyError(mutation.error)}</Alert>}
        <button type="submit" className="btn btn-primary" disabled={!allAnswered || mutation.isPending}>
          {mutation.isPending ? 'Corrigindo…' : 'Enviar respostas'}
        </button>
        {!allAnswered && <p className="text-sm text-ink/60">Responda todas as questões para enviar.</p>}
      </form>
    </Shell>
  )
}

function Shell({ title, children }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-3xl">{title}</h1>
      {children}
    </div>
  )
}
