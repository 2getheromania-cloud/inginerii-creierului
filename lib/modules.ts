// lib/modules.ts
//
// Citirea modulelor pentru dashboard. Se apelează cu clientul obișnuit al
// utilizatorului, nu cu cheia de service: RLS decide ce se vede.
//
// Ce se vede și ce nu:
//   • titlurile TUTUROR modulelor, inclusiv ale celor care nu s-au deschis —
//     omul trebuie să vadă ce urmează și la ce dată;
//   • lecțiile (deci id-urile video) DOAR ale modulelor deja deschise.
// A doua regulă e în politica RLS, nu aici. Codul din pagină nu o poate ocoli
// din greșeală, pentru că nici serverul nu primește rândurile.

import type { SupabaseClient } from '@supabase/supabase-js'

export type ModuleRow = {
  id: string
  position: number
  slug: string
  title: string
  summary: string | null
  instrument: string | null
  is_bonus: boolean
  unlock_at: string
  unlocked: boolean
}

export type Lesson = {
  id: string
  position: number
  title: string
  video_id: string | null
  duration_seconds: number | null
}

export async function getMyModules(supabase: SupabaseClient): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from('my_modules')
    .select('*')
    .order('position')
  if (error) throw error
  return (data ?? []) as ModuleRow[]
}

export async function getLessons(
  supabase: SupabaseClient,
  moduleId: string
): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, position, title, video_id, duration_seconds')
    .eq('module_id', moduleId)
    .order('position')
  if (error) throw error
  // Listă goală pe un modul nedeschis: RLS a filtrat rândurile.
  return (data ?? []) as Lesson[]
}

export async function markLessonDone(supabase: SupabaseClient, lessonId: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('neautentificat')
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({ user_id: auth.user.id, lesson_id: lessonId })
  if (error) throw error
}

/**
 * Câte module a început omul. Asta decide garanția de 14 zile,
 * care se acordă „dacă ai parcurs mai puțin de 3 module".
 * Un modul se consideră început la prima lecție bifată.
 */
export async function modulesStarted(
  supabase: SupabaseClient,
  programId: string
): Promise<number> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return 0
  const { data, error } = await supabase.rpc('modules_started', {
    p_user: auth.user.id,
    p_program: programId,
  })
  if (error) throw error
  return (data as number) ?? 0
}

/** „Se deschide în 9 zile" / „Se deschide mâine" / „Se deschide pe 12 noiembrie". */
export function unlockLabel(unlockAt: string, now = new Date()): string {
  const target = new Date(unlockAt)
  const days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
  if (days <= 0) return 'Disponibil acum'
  if (days === 1) return 'Se deschide mâine'
  if (days <= 14) return `Se deschide în ${days} zile`
  return `Se deschide pe ${target.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
  })}`
}
