'use client'
// Scrierea în resource_entries, ca la fișele „Cele 7 Etape".
// RLS lasă omul să scrie doar rândul lui și doar pe instrumentele care au
// voie să salveze (saves_answers = true).
import { createClient } from '@/lib/supabase/client'

export async function salveaza(resourceId: string, data: unknown): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'Sesiunea a expirat. Reîncarcă pagina.'
  const { error } = await supabase.from('resource_entries').upsert({
    user_id: user.id,
    resource_id: resourceId,
    data,
    updated_at: new Date().toISOString(),
  })
  return error ? 'Nu s-a putut salva. Încearcă din nou.' : null
}
