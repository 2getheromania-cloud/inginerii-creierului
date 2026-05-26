import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: convs } = await service()
    .from('conversations')
    .select('id')
    .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id},user_id.eq.${user.id}`)

  if (!convs?.length) return NextResponse.json({})

  const { data: unread } = await service()
    .from('private_messages')
    .select('sender_id')
    .eq('read', false)
    .neq('sender_id', user.id)
    .in('conversation_id', convs.map((c: { id: string }) => c.id))

  const counts: Record<string, number> = {}
  for (const msg of (unread ?? []) as { sender_id: string }[]) {
    counts[msg.sender_id] = (counts[msg.sender_id] ?? 0) + 1
  }

  return NextResponse.json(counts)
}
