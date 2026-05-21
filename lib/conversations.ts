import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function getOrCreateConversation(userId: string): Promise<string> {
  const { data: existing } = await service()
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (existing) return existing.id

  const { data: created } = await service()
    .from('conversations')
    .insert({ user_id: userId })
    .select('id')
    .single()
  return created!.id
}
