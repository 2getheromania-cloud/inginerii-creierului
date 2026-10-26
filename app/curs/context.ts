// Datele comune paginilor cursului: cine e omul, în ce săptămână e și ce vede.
//
// Adminul vede tot programul deschis. Cu ?saptamana=N vede exact ce vede un
// cursant aflat în săptămâna N — util ca să verifice cum arată o săptămână
// înainte să ajungă grupa acolo.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { TOTAL_SAPTAMANI } from '@/lib/curs-microbiom'

export async function contextCurs(saptamanaCeruta?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  const esteAdmin = profile.role === 'admin'
  const ceruta = Number.parseInt(saptamanaCeruta ?? '', 10)
  const previzualizare =
    esteAdmin && Number.isFinite(ceruta)
      ? Math.min(Math.max(ceruta, 1), TOTAL_SAPTAMANI)
      : null

  const saptamana = previzualizare ?? profile.week

  return {
    profile,
    saptamana,
    /** Acces complet, fără blocarea pe săptămâni. */
    admin: esteAdmin && previzualizare === null,
    esteAdmin,
    previzualizare,
    protocoale: profile.protocols ?? [],
    /** Păstrează previzualizarea în linkurile interne ale cursului. */
    cu: (href: string) =>
      previzualizare === null ? href : `${href}?saptamana=${previzualizare}`,
  }
}

export type ContextCurs = Awaited<ReturnType<typeof contextCurs>>
