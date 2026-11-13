import { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ErrorBoundary from '../components/ErrorBoundary'
import ProgressBar from '../components/ProgressBar'
import { Alert, ErrorState, Spinner } from '../components/Feedback'
import { keys, useCourse, useExam, useLessonProgress, useMyEnrollments, useMyProgress } from '../hooks/queries'
import { buildCurriculum, neighbors, pickResumeLesson } from '../lib/progress'
import { friendlyError } from '../lib/errors'
import { completeLesson, startLesson } from '../services/progressService'
import { getLessonComponent } from '../courses/registry'

function Curriculum({ modules, currentId, completedIds, slug }) {
  return (
    <nav aria-label="Módulos e aulas" className="space-y-5">
      {modules.map((m) => (
        <div key={m.id}>
          <h2 className="mb-1 text-base">{m.title}</h2>
          <ul className="space-y-1">
            {m.lessons.map((l) => {
              const done = completedIds.has(l.id)
              const current = l.id === currentId
              return (
                <li key={l.id}>
                  <Link
                    to={`/aprender/${slug}/${l.id}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 ${current ? 'bg-brand-500 font-bold text-white' : 'hover:bg-brand-50'}`}
                  >
                    <span aria-hidden="true" className="mt-0.5 w-4 shrink-0">{done ? '✓' : current ? '▶' : '○'}</span>
                    <span>
                      {l.title}
                      <span className="sr-only">{done ? ' (concluída)' : ''}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function Learn() {
  const { slug, lessonId } = useParams()
  const queryClient = useQueryClient()
  const courseQ = useCourse(slug)
  const enrollments = useMyEnrollments()
  const progress = useMyProgress()
  const course = courseQ.data
  const [celebrate, setCelebrate] = useState(false)

  const { modules, flat } = useMemo(() => buildCurriculum(course), [course])
  const enrollment = enrollments.data?.find((e) => e.course_id === course?.id)
  const courseProgress = progress.data?.find((p) => p.course_id === course?.id)
  const lessonProgress = useLessonProgress(course?.id, flat.map((l) => l.id))
  const exam = useExam(course?.id, !!enrollment)
  const completedIds = useMemo(
    () => new Set((lessonProgress.data || []).filter((l) => l.completed).map((l) => l.lesson_id)),
    [lessonProgress.data],
  )
  const current = flat.find((l) => l.id === lessonId)
  const { prev, next } = neighbors(flat, lessonId)

  const refresh = () =>
    Promise.all(
      [keys.progress, keys.enrollments, keys.lessonProgress(course?.id)].map((k) => queryClient.invalidateQueries({ queryKey: k })),
    )

  const completeMutation = useMutation({
    mutationFn: (id) => completeLesson(id),
    onSuccess: async () => {
      setCelebrate(true)
      await refresh()
      setTimeout(() => setCelebrate(false), 2200)
    },
  })

  // Registra o acesso à aula (idempotente no servidor) para "continuar de onde parou".
  const currentId = current?.id
  const enrolled = !!enrollment
  useEffect(() => {
    if (!currentId || !enrolled) return
    startLesson(currentId)
      .then(() => queryClient.invalidateQueries({ queryKey: keys.progress }))
      .catch(() => {})
  }, [currentId, enrolled, queryClient])

  if (courseQ.isLoading || enrollments.isLoading) return <Spinner label="Abrindo o curso…" />
  if (courseQ.error || enrollments.error) return <ErrorState error={courseQ.error || enrollments.error} onRetry={() => { courseQ.refetch(); enrollments.refetch() }} />
  if (!course) return <Navigate to="/painel" replace />
  if (!enrollment) return <Navigate to={`/cursos/${slug}`} replace />
  if (!flat.length) return <p className="p-8 text-center">Este curso ainda não tem aulas publicadas.</p>
  if (lessonProgress.isLoading) return <Spinner label="Carregando suas aulas…" />

  if (!current) {
    const resume = pickResumeLesson(flat, courseProgress?.last_lesson_id, completedIds)
    return <Navigate to={`/aprender/${slug}/${resume.id}`} replace />
  }

  const isDone = completedIds.has(current.id)
  const LessonContent = getLessonComponent(current.content_path)
  const allDone = courseProgress?.progress_percent >= 100
  const handleReady = () => {
    if (!isDone && !completeMutation.isPending) completeMutation.mutate(current.id)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[300px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <Link to={`/cursos/${slug}`} className="link">{course.name}</Link>
          <ProgressBar value={courseProgress?.progress_percent ?? 0} label="Progresso no curso" />
          <Curriculum modules={modules} currentId={current.id} completedIds={completedIds} slug={slug} />
        </div>
      </aside>

      <div className="min-w-0">
        <details className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-brand-100 lg:hidden">
          <summary className="cursor-pointer font-bold">Módulos e aulas ({Math.round(courseProgress?.progress_percent ?? 0)}%)</summary>
          <div className="mt-4">
            <Curriculum modules={modules} currentId={current.id} completedIds={completedIds} slug={slug} />
          </div>
        </details>

        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-ink/70">{current.moduleTitle}</p>
            <h1 className="mb-6 text-3xl">{current.title}</h1>
            <ErrorBoundary message="Não foi possível carregar esta aula.">
              <Suspense fallback={<Spinner label="Carregando aula…" />}>
                <LessonContent onComplete={handleReady} />
              </Suspense>
            </ErrorBoundary>
          </motion.article>
        </AnimatePresence>

        {completeMutation.error && <div className="mt-6"><Alert type="error">{friendlyError(completeMutation.error)}</Alert></div>}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 pt-6">
          {prev ? <Link to={`/aprender/${slug}/${prev.id}`} className="btn btn-ghost">Aula anterior</Link> : <span />}
          {isDone ? (
            <span className="relative inline-flex items-center gap-2 font-bold text-leaf">
              <AnimatePresence>
                {celebrate && (
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-leaf text-white"
                  >
                    ✓
                  </motion.span>
                )}
              </AnimatePresence>
              Aula concluída
            </span>
          ) : (
            <button type="button" className="btn btn-sun" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate(current.id)}>
              {completeMutation.isPending ? 'Salvando…' : 'Concluir aula'}
            </button>
          )}
          {next ? <Link to={`/aprender/${slug}/${next.id}`} className="btn btn-primary">Próxima aula</Link> : <span />}
        </div>

        {allDone && (
          <div className="mt-8 rounded-2xl bg-brand-50 p-5">
            <p className="font-bold">Você concluiu todas as aulas.</p>
            <Link to={exam.data && enrollment.status !== 'completed' ? `/cursos/${slug}/prova` : `/cursos/${slug}`} className="btn btn-primary mt-3">
              {exam.data && enrollment.status !== 'completed' ? 'Fazer a avaliação final' : 'Ver o curso e o certificado'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
