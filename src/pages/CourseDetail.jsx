import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ProgressBar from '../components/ProgressBar'
import { Alert, ErrorState, Spinner } from '../components/Feedback'
import { keys, useCourse, useExam, useLessonProgress, useMyCertificates, useMyEnrollments, useMyProgress } from '../hooks/queries'
import { useAuthStore } from '../store/authStore'
import { buildCurriculum, minutesLabel, pickResumeLesson } from '../lib/progress'
import { friendlyError } from '../lib/errors'
import { enroll } from '../services/enrollmentService'
import { issueCertificate } from '../services/certificateService'

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const courseQ = useCourse(slug)
  const enrollments = useMyEnrollments()
  const progress = useMyProgress()
  const certificates = useMyCertificates()
  const course = courseQ.data

  const { modules, flat } = useMemo(() => buildCurriculum(course), [course])
  const enrollment = enrollments.data?.find((e) => e.course_id === course?.id)
  const courseProgress = progress.data?.find((p) => p.course_id === course?.id)
  const certificate = certificates.data?.find((c) => c.course_id === course?.id)
  const exam = useExam(course?.id, !!enrollment)
  const lessonProgress = useLessonProgress(course?.id, flat.map((l) => l.id))
  const completedIds = useMemo(
    () => new Set((lessonProgress.data || []).filter((l) => l.completed).map((l) => l.lesson_id)),
    [lessonProgress.data],
  )
  const resume = pickResumeLesson(flat, courseProgress?.last_lesson_id, completedIds)

  const refresh = () =>
    Promise.all([keys.enrollments, keys.progress, keys.certificates].map((k) => queryClient.invalidateQueries({ queryKey: k })))

  const enrollMutation = useMutation({
    mutationFn: () => enroll(course.id),
    onSuccess: async () => {
      await refresh()
      if (flat[0]) navigate(`/aprender/${slug}/${flat[0].id}`)
    },
  })

  const certMutation = useMutation({
    mutationFn: () => issueCertificate(course.id),
    onSuccess: async (cert) => {
      await refresh()
      navigate(`/certificados/${cert.id}`)
    },
  })

  if (courseQ.isLoading) return <Spinner label="Carregando curso…" />
  if (courseQ.error) return <ErrorState error={courseQ.error} onRetry={courseQ.refetch} />
  if (!course)
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Curso não encontrado</h1>
        <Link to="/#cursos" className="link mt-4 inline-block">Ver todos os cursos</Link>
      </div>
    )

  const allDone = courseProgress && courseProgress.total_lessons > 0 && courseProgress.progress_percent >= 100
  const mutationError = enrollMutation.error || certMutation.error

  let action
  if (!session) {
    action = <Link to="/cadastro" className="btn btn-primary">Criar conta para começar</Link>
  } else if (!enrollment) {
    action = (
      <button type="button" className="btn btn-primary" disabled={enrollMutation.isPending || !flat.length} onClick={() => enrollMutation.mutate()}>
        {enrollMutation.isPending ? 'Matriculando…' : 'Matricular-me gratuitamente'}
      </button>
    )
  } else {
    action = (
      <div className="flex flex-wrap gap-3">
        {resume && enrollment.status !== 'completed' && (
          <Link to={`/aprender/${slug}/${resume.id}`} className="btn btn-primary">
            {courseProgress?.completed_lessons ? 'Continuar curso' : 'Iniciar curso'}
          </Link>
        )}
        {allDone && exam.data && enrollment.status !== 'completed' && (
          <Link to={`/cursos/${slug}/prova`} className="btn btn-sun">Fazer a avaliação final</Link>
        )}
        {enrollment.status === 'completed' && !certificate && (
          <button type="button" className="btn btn-sun" disabled={certMutation.isPending} onClick={() => certMutation.mutate()}>
            {certMutation.isPending ? 'Emitindo…' : 'Emitir meu certificado'}
          </button>
        )}
        {certificate && <Link to={`/certificados/${certificate.id}`} className="btn btn-sun">Ver meu certificado</Link>}
        {enrollment.status === 'completed' && resume && (
          <Link to={`/aprender/${slug}/${resume.id}`} className="btn btn-ghost">Rever as aulas</Link>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl md:text-5xl">{course.name}</h1>
      <p className="mt-4 max-w-prose text-xl text-ink/80">{course.description}</p>
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-ink/80">
        {course.teacher && (
          <div><dt className="inline font-bold">Professor: </dt><dd className="inline">{course.teacher}</dd></div>
        )}
        <div><dt className="inline font-bold">Duração: </dt><dd className="inline">{minutesLabel(course.duration_minutes)}</dd></div>
        <div><dt className="inline font-bold">Conteúdo: </dt><dd className="inline">{modules.length} módulos, {flat.length} aulas</dd></div>
      </dl>

      {enrollment && courseProgress && (
        <div className="mt-6 max-w-md">
          <ProgressBar value={courseProgress.progress_percent} label="Seu progresso no curso" />
        </div>
      )}
      {mutationError && <div className="mt-4"><Alert type="error">{friendlyError(mutationError)}</Alert></div>}
      <div className="mt-6">{action}</div>

      <section aria-labelledby="conteudo-curso" className="mt-12">
        <h2 id="conteudo-curso" className="mb-4 text-2xl">Conteúdo do curso</h2>
        <ol className="space-y-4">
          {modules.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
              <h3 className="text-lg">{m.title}</h3>
              {m.description && <p className="text-ink/70">{m.description}</p>}
              <ul className="mt-3 space-y-1">
                {m.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3">
                    <span>
                      {completedIds.has(l.id) && <span className="mr-2 font-bold text-leaf" aria-label="Concluída">✓</span>}
                      {l.title}
                    </span>
                    <span className="shrink-0 text-sm text-ink/60">{minutesLabel(l.duration_minutes)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
