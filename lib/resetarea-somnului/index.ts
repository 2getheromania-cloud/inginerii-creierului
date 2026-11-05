// lib/resetarea-somnului/index.ts
//
// Citirea programului „Resetarea Somnului" pentru paginile cursantului.
// Același principiu ca la „Cele 7 Etape": totul trece prin clientul
// utilizatorului, iar RLS decide ce se vede. Codul de aici nu poate da acces
// peste ce a plătit omul, pentru că nici serverul nu primește rândurile.
//
// DIFERENȚA FAȚĂ DE lib/sapte-etape.ts: vederile my_modules și my_resources
// întorc rânduri pentru TOATE programele omului. Cine are și „Cele 7 Etape",
// și programul de somn le-ar vedea amestecate. Aici fiecare citire se
// filtrează pe program_id.

import type { SupabaseClient } from '@supabase/supabase-js'

export const PROGRAM_SLUG = 'resetarea-somnului'
export const ZILE_PROGRAM = 21

export type ModulSomn = {
  id: string
  program_id: string
  position: number
  slug: string
  title: string
  summary: string | null
  instrument: string | null
  unlock_at: string
  unlocked: boolean
}

export type InstrumentSomn = {
  id: string
  slug: string
  title: string
  path: string | null
}

/** Id-ul programului. Tabelul `programs` e lizibil oricui e autentificat. */
export async function getProgramId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle()
  return (data?.id as string) ?? null
}

/** Modulele programului de somn. Listă goală = omul nu e înscris. */
export async function getModuleSomn(
  supabase: SupabaseClient,
  programId: string
): Promise<ModulSomn[]> {
  const { data, error } = await supabase
    .from('my_modules')
    .select('id, program_id, position, slug, title, summary, instrument, unlock_at, unlocked')
    .eq('program_id', programId)
    .order('position')
  if (error) throw error
  return (data ?? []) as ModulSomn[]
}

/** Cele două instrumente: testul și jurnalul. */
export async function getInstrumente(
  supabase: SupabaseClient,
  programId: string
): Promise<Record<string, InstrumentSomn>> {
  const { data, error } = await supabase
    .from('my_resources')
    .select('id, slug, title, path')
    .eq('program_id', programId)
  if (error) throw error
  const map: Record<string, InstrumentSomn> = {}
  for (const r of (data ?? []) as InstrumentSomn[]) map[r.slug] = r
  return map
}

/** Ce a salvat omul într-un instrument. {} dacă n-a salvat încă nimic. */
export async function getDate<T>(
  supabase: SupabaseClient,
  resourceId: string
): Promise<T | null> {
  const { data } = await supabase
    .from('resource_entries')
    .select('data')
    .eq('resource_id', resourceId)
    .maybeSingle()
  return (data?.data as T) ?? null
}

/**
 * Ziua din program, 1–21, după data înscrierii.
 * Data înscrierii e unlock_at al modulului 1, care are decalaj 0.
 * După ziua 21 întoarce 22: programul s-a încheiat, accesul rămâne.
 */
export function ziuaCurenta(module: ModulSomn[], now = new Date()): number {
  const primul = module.find(m => m.position === 1)
  if (!primul) return 1
  const start = new Date(primul.unlock_at)
  // Ziua se schimbă la miezul nopții, ora României, nu la ora plății.
  const zi = (d: Date) =>
    Date.UTC(
      ...(d
        .toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' })
        .split('-')
        .map((x, i) => (i === 1 ? Number(x) - 1 : Number(x))) as [number, number, number])
    )
  const diferenta = Math.floor((zi(now) - zi(start)) / 86_400_000)
  return Math.min(Math.max(diferenta + 1, 1), ZILE_PROGRAM + 1)
}

export function etichetaDeschidere(unlockAt: string, now = new Date()): string {
  const target = new Date(unlockAt)
  const zile = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
  if (zile <= 0) return 'Disponibil acum'
  if (zile === 1) return 'Se deschide mâine'
  return `Se deschide în ${zile} zile`
}
