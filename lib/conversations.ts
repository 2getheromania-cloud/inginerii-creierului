import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const db = service()

  // 1. Find existing new-style conversation (both participant columns set)
  const { data: existing } = await db
    .from('conversations')
    .select('id')
    .or(`and(participant_a_id.eq.${userA},participant_b_id.eq.${userB}),and(participant_a_id.eq.${userB},participant_b_id.eq.${userA})`)
    .maybeSingle()
  if (existing) return existing.id

  // 2. Upgrade old-style or half-migrated rows for either user
  for (const [uid, other] of [[userA, userB], [userB, userA]]) {
    // Half-migrated: participant_a_id set, participant_b_id missing
    const { data: half } = await db
      .from('conversations')
      .select('id')
      .eq('participant_a_id', uid)
      .is('participant_b_id', null)
      .maybeSingle()
    if (half) {
      await db.from('conversations').update({ participant_b_id: other }).eq('id', half.id)
      return half.id
    }

    // Truly old-style: user_id set, participant_a_id null
    const { data: oldStyle } = await db
      .from('conversations')
      .select('id')
      .eq('user_id', uid)
      .is('participant_a_id', null)
      .maybeSingle()
    if (oldStyle) {
      await db.from('conversations').update({ participant_a_id: uid, participant_b_id: other }).eq('id', oldStyle.id)
      return oldStyle.id
    }
  }

  // 3. Create new conversation
  const { data: created } = await db
    .from('conversations')
    .insert({ participant_a_id: userA, participant_b_id: userB })
    .select('id')
    .single()
  return created!.id
}
