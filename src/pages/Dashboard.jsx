import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import CourseCard from '../components/CourseCard'
import ProgressBar from '../components/ProgressBar'
import { EmptyState, ErrorState, Spinner } from '../components/Feedback'
import { useCourses, useMyCertificates, useMyEnrollments, useMyProgress, useProfile } from '../hooks/queries'

export default function Dashboard() {
  const profile = useProfile()
  const courses = useCourses()
  const enrollments = useMyEnrollments()
  const progress = useMyProgress()
  const certificates = useMyCertificates()

  const view = useMemo(() => {
    if (!courses.data || !enrollments.data || !progress.data) return null
    const enrollmentByCourse = new Map(enrollments.data.map((e) => [e.course_id, e]))
    const progressByCourse = new Map(progress.data.map((p) => [p.course_id, p]))
    const mine = courses.data.filter((c) => enrollmentByCourse.has(c.id))
    const available = courses.data.filter((c) => !enrollmentByCourse.has(c.id))
    const total = progress.data.reduce((n, p) => n + p.total_lessons, 0)
    const done = progress.data.reduce((n, p) => n + p.completed_lessons, 0)
    const last = progress.data
      .filter((p) => p.last_lesson_id && enrollmentByCourse.get(p.course_id)?.status === 'active')
      .sort((a, b) => new Date(b.last_accessed_at) - new Date(a.last_accessed_at))[0]
    const lastCourse = last && courses.data.find((c) => c.id === last.course_id)
    return {
      enrollmentByCourse,
      progressByCourse,
      mine,
      available,
      overall: total ? (100 * done) / total : 0,
      inProgress: enrollments.data.filter((e) => e.status === 'active').length,
      completed: enrollments.data.filter((e) => e.status === 'completed').length,
      resume: last && lastCourse ? { course: lastCourse, lessonId: last.last_lesson_id } : null,
    }
  }, [courses.data, enrollments.data, progress.data])

  const failed = courses.error || enrollments.error || progress.error
  if (failed) return <ErrorState error={failed} onRetry={() => [courses, enrollments, progress].forEach((q) => q.refetch())} />
  if (!view) return <Spinner label="Carregando seu painel…" />

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <header className="grid gap-6 md:grid-cols-[1fr_320px] md:items-end">
        <div>
          <h1 className="text-3xl md:text-4xl">Olá, {profile.data?.name ?? 'aluno'}!</h1>
          <p className="mt-2 text-ink/75">
            {view.inProgress} em andamento · {view.completed} concluído(s) · {certificates.data?.length ?? 0} certificado(s)
          </p>
          {view.resume && (
            <Link to={`/aprender/${view.resume.course.slug}/${view.resume.lessonId}`} className="btn btn-primary mt-5">
              Continuar aprendendo: {view.resume.course.name}
            </Link>
          )}
        </div>
        <div>
          <p className="mb-1 font-bold">Progresso geral</p>
          <ProgressBar value={view.overall} label="Progresso geral" />
        </div>
      </header>

      <section aria-labelledby="meus-cursos">
        <h2 id="meus-cursos" className="mb-5 text-2xl">Meus cursos</h2>
        {view.mine.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {view.mine.map((c) => (
              <CourseCard key={c.id} course={c} enrollment={view.enrollmentByCourse.get(c.id)} progress={view.progressByCourse.get(c.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title="Você ainda não começou nenhum curso">Escolha um curso abaixo para se matricular.</EmptyState>
        )}
      </section>

      <section aria-labelledby="disponiveis">
        <h2 id="disponiveis" className="mb-5 text-2xl">Cursos disponíveis</h2>
        {view.available.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {view.available.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <p className="text-ink/70">Você já está matriculado em todos os cursos disponíveis.</p>
        )}
      </section>

      <section aria-labelledby="certs">
        <h2 id="certs" className="mb-5 text-2xl">Certificados conquistados</h2>
        {certificates.data?.length ? (
          <ul className="space-y-3">
            {certificates.data.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                <span className="font-bold">{c.course_name}</span>
                <Link to={`/certificados/${c.id}`} className="link">Ver certificado</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/70">Conclua um curso para receber seu certificado.</p>
        )}
      </section>
    </div>
  )
}
