// lib/sapte-etape.ts
//
// Citirea programului „Cele 7 Etape" pentru paginile cursantului.
// Totul trece prin clientul obișnuit al utilizatorului, niciodată prin cheia
// de service: RLS decide ce se vede. Codul de aici nu poate da din greșeală
// acces peste ce a plătit omul, pentru că nici serverul nu primește rândurile.
//
// Trei filtre lucrează în bază, nu aici:
//   • înscrierea activă și în perioada de acces;
//   • deschiderea progresivă — lecțiile unui modul apar la
//     enrolled_at + drip_offset_days, relativ la fiecare om;
//   • treapta plătită — fișele se dau numai de la „harta_instrumente" în sus.

import type { SupabaseClient } from '@supabase/supabase-js'

export const PROGRAM_SLUG = 'cele-7-etape'

export type Tier = 'harta' | 'harta_instrumente' | 'ghidare'

export type ModulRand = {
  id: string
  program_id: string
  position: number
  slug: string
  title: string
  summary: string | null
  instrument: string | null
  is_bonus: boolean
  tier: Tier
  has_instruments: boolean
  unlock_at: string
  unlocked: boolean
}

export type Lectie = {
  id: string
  position: number
  title: string
  video_id: string | null
  duration_seconds: number | null
}

export type Resursa = {
  id: string
  module_id: string | null
  module_position: number | null
  position: number
  slug: string
  title: string
  kind: string
  path: string | null
  saves_answers: boolean
  started: boolean
}

/** Toate modulele programului, deschise sau nu. Listă goală = nu e înscris. */
export async function getModule(supabase: SupabaseClient): Promise<ModulRand[]> {
  const { data, error } = await supabase
    .from('my_modules')
    .select('*')
    .order('position')
  if (error) throw error
  return (data ?? []) as ModulRand[]
}

/** Lecțiile unui modul. Listă goală pe un modul nedeschis: RLS a filtrat. */
export async function getLectii(
  supabase: SupabaseClient,
  moduleId: string
): Promise<Lectie[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, position, title, video_id, duration_seconds')
    .eq('module_id', moduleId)
    .order('position')
  if (error) throw error
  return (data ?? []) as Lectie[]
}

/** Fișele la care omul are acces acum. Pe treapta „harta" iese doar testul. */
export async function getResurse(supabase: SupabaseClient): Promise<Resursa[]> {
  const { data, error } = await supabase
    .from('my_resources')
    .select('*')
    .order('position')
  if (error) throw error
  return (data ?? []) as Resursa[]
}

/** Lecțiile bifate, ca mulțime de id-uri. */
export async function getProgres(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from('lesson_progress').select('lesson_id')
  if (error) throw error
  return new Set((data ?? []).map((r: { lesson_id: string }) => r.lesson_id))
}

/** „Se deschide mâine" / „Se deschide în 9 zile" / „Se deschide pe 12 noiembrie". */
export function etichetaDeschidere(unlockAt: string, now = new Date()): string {
  const target = new Date(unlockAt)
  const zile = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
  if (zile <= 0) return 'Disponibil acum'
  if (zile === 1) return 'Se deschide mâine'
  if (zile <= 14) return `Se deschide în ${zile} zile`
  return `Se deschide pe ${target.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
  })}`
}

/** 428 → „7 min". Pentru liste; la o singură lecție arătăm și secundele. */
export function durata(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.round(seconds / 60)
  return `${m} min`
}

export function durataExacta(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
