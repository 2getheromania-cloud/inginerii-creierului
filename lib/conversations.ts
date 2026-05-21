import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const db = service()

  // Find existing conversation between the two users (either order)
  const { data: existing } = await db
    .from('conversations')
    .select('id')
    .or(`and(participant_a_id.eq.${userA},participant_b_id.eq.${userB}),and(participant_a_id.eq.${userB},participant_b_id.eq.${userA})`)
    .maybeSingle()
  if (existing) return existing.id

  // Upgrade old-style row (participant_b_id IS NULL) for either user
  for (const [uid, other] of [[userA, userB], [userB, userA]]) {
    const { data: old } = await db
      .from('conversations')
      .select('id')
      .eq('participant_a_id', uid)
      .is('participant_b_id', null)
      .maybeSingle()
    if (old) {
      await db.from('conversations').update({ participant_b_id: other }).eq('id', old.id)
      return old.id
    }
  }

  const { data: created } = await db
    .from('conversations')
    .insert({ participant_a_id: userA, participant_b_id: userB })
    .select('id')
    .single()
  return created!.id
}
