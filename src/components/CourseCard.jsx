import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { minutesLabel } from '../lib/progress'

const STATUS = {
  active: { text: 'Em andamento', cls: 'bg-brand-50 text-brand-700' },
  completed: { text: 'Concluído', cls: 'bg-emerald-50 text-leaf' },
  cancelled: { text: 'Matrícula cancelada', cls: 'bg-red-50 text-danger' },
}

export default function CourseCard({ course, enrollment, progress }) {
  const status = enrollment ? STATUS[enrollment.status] : null
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
      {course.image_url ? (
        <img src={course.image_url} alt="" loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="flex h-40 items-center justify-center bg-brand-500 font-display text-6xl font-extrabold text-white">
          {course.name.slice(0, 1)}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-xl">{course.name}</h3>
        <p className="line-clamp-3 text-ink/75">{course.description}</p>
        <p className="text-sm text-ink/65">
          {minutesLabel(course.duration_minutes)} · {course.moduleCount ?? 0} módulos
          {course.lessonCount != null ? ` · ${course.lessonCount} aulas` : ''}
        </p>
        {status && <span className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${status.cls}`}>{status.text}</span>}
        {enrollment && progress && <ProgressBar value={progress.progress_percent} label={`Progresso em ${course.name}`} />}
        <Link to={`/cursos/${course.slug}`} className="btn btn-primary mt-auto">
          {enrollment ? 'Abrir curso' : 'Ver curso'}
        </Link>
      </div>
    </article>
  )
}
