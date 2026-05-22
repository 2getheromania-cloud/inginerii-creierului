import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function getOrCreateConversation(userA: string, userB: string): Promise<string> {
  const db = service()

  // 1. Find existing new-style conversation (both participant columns set).
  // Uses two separate queries (one per ordering) to avoid the PostgREST nested
  // and() inside .or() syntax, which can silently fail and cause duplicates.
  // When duplicates exist, picks the conversation that has the most recent
  // message — so both sides always converge on the same active conversation.
  const allConvIds: string[] = []
  for (const [a, b] of [[userA, userB], [userB, userA]]) {
    const { data: rows } = await db
      .from('conversations')
      .select('id')
      .eq('participant_a_id', a)
      .eq('participant_b_id', b)
    for (const row of (rows ?? []) as { id: string }[]) {
      if (!allConvIds.includes(row.id)) allConvIds.push(row.id)
    }
  }
  if (allConvIds.length === 1) return allConvIds[0]
  if (allConvIds.length > 1) {
    // Multiple conversations: pick the one with the most recent message
    const { data: msgRow } = await db
      .from('private_messages')
      .select('conversation_id')
      .in('conversation_id', allConvIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    // Fall back to first found (oldest by insert order) if no messages yet
    return (msgRow as { conversation_id: string } | null)?.conversation_id ?? allConvIds[0]
  }

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
