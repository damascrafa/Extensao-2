// Funções puras para montar o currículo a partir do que o Supabase devolve.

export function sortByOrder(list = []) {
  return [...list].sort((a, b) => a.order_index - b.order_index)
}

// course = { modules: [{ id, title, order_index, lessons: [{ id, is_active, order_index, ... }] }] }
export function buildCurriculum(course) {
  const modules = sortByOrder(course?.modules).map((m) => ({
    ...m,
    lessons: sortByOrder((m.lessons || []).filter((l) => l.is_active)),
  }))
  const flat = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })))
  return { modules, flat }
}

export function neighbors(flat, lessonId) {
  const i = flat.findIndex((l) => l.id === lessonId)
  return {
    index: i,
    prev: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
  }
}

// Aula a abrir ao "continuar": a última acessada, senão a primeira ainda não concluída, senão a primeira.
export function pickResumeLesson(flat, lastLessonId, completedIds = new Set()) {
  if (!flat.length) return null
  const last = flat.find((l) => l.id === lastLessonId)
  if (last) return last
  return flat.find((l) => !completedIds.has(l.id)) || flat[0]
}

export function minutesLabel(min) {
  if (!min) return 'Duração livre'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r ? `${h} h ${r} min` : `${h} h`
}
