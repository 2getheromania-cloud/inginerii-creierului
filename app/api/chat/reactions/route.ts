import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { message_id, emoji } — toggle reaction
export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message_id, emoji } = await req.json() as { message_id: string; emoji: string }
  if (!message_id || !emoji) return NextResponse.json({ error: 'Câmpuri lipsă.' }, { status: 400 })

  const { data: existing } = await service()
    .from('group_chat_reactions')
    .select('id')
    .eq('message_id', message_id)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await service().from('group_chat_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    await service().from('group_chat_reactions').insert({ message_id, user_id: user.id, emoji })
    return NextResponse.json({ action: 'added' })
  }
}
