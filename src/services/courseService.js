import { supabase, unwrap } from '../lib/supabase'

// Lista pública (RLS: só cursos ativos). Traz módulos/aulas só para contar.
export async function listCourses() {
  const rows = unwrap(
    await supabase
      .from('courses')
      .select('id,name,slug,description,teacher,duration_minutes,image_url,modules(id,lessons(id,is_active))')
      .order('created_at', { ascending: true }),
  )
  return rows.map(({ modules, ...c }) => ({
    ...c,
    moduleCount: modules.length,
    lessonCount: modules.reduce((n, m) => n + m.lessons.filter((l) => l.is_active).length, 0),
  }))
}

export async function getCourseBySlug(slug) {
  return unwrap(
    await supabase
      .from('courses')
      .select(
        'id,name,slug,description,teacher,duration_minutes,image_url,' +
          'modules(id,title,description,order_index,lessons(id,title,description,content_path,duration_minutes,order_index,is_active))',
      )
      .eq('slug', slug)
      .maybeSingle(),
  )
}
