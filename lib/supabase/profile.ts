import { createClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

// Client admin (service role) — fără cookie-uri, bypass complet RLS
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Returnează profilul utilizatorului. Dacă nu există (trigger SQL nu a rulat),
 * îl creează automat cu service role. Nu face niciodată redirect.
 */
export async function getOrCreateProfile(
  userId: string,
  email: string
): Promise<Profile | null> {
  const admin = adminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) return existing as Profile

  // Profilul lipsește — îl creăm (upsert idempotent)
  const isAdmin = email === process.env.ADMIN_EMAIL
  const { data: created, error } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        role: isAdmin ? 'admin' : 'cursant',
        week: 1,
        flags: { sibo: false, candidoza: false, rezistenta_insulina: false, tiroida: false },
        saved_dates: {},
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[getOrCreateProfile] error:', error.message)
    return null
  }

  return created as Profile
}
