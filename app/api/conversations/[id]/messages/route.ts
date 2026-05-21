import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getConvAndCheck(convId: string, userId: string) {
  const { data: conv } = await service()
    .from('conversations')
    .select('user_id, participant_a_id, participant_b_id')
    .eq('id', convId)
    .single()
  if (!conv) return null
  const { data: profile } = await service().from('profiles').select('role').eq('id', userId).single()
  const isAdmin = profile?.role === 'admin'
  const isParticipant =
    conv.user_id === userId || conv.participant_a_id === userId || conv.participant_b_id === userId
  if (!isParticipant && !isAdmin) return null
  return { conv, isAdmin }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const checked = await getConvAndCheck(params.id, user.id)
  if (!checked) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })

  const { data } = await service()
    .from('private_messages')
    .select('*, reactions:private_message_reactions(emoji, user_id), reply_to:private_messages!reply_to_id(id, content, sender_id)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json(data ?? [])
}

// Mark all messages in this conversation as read (for the current user)
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const checked = await getConvAndCheck(params.id, user.id)
  if (!checked) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 })

  await service()
    .from('private_messages')
    .update({ read: true })
    .eq('conversation_id', params.id)
    .eq('read', false)
    .neq('sender_id', user.id)

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, reply_to_id } = await req.json() as { content: string; reply_to_id?: string | null }
  if (!content?.trim()) return NextResponse.json({ error: 'Mesaj gol' }, { status: 400 })

  const { data: conv } = await service()
    .from('conversations')
    .select('user_id, participant_a_id, participant_b_id')
    .eq('id', params.id)
    .single()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: senderProfile } = await service()
    .from('profiles')
    .select('role, name, email')
    .eq('id', user.id)
    .single()
  const isAdmin = senderProfile?.role === 'admin'
  const isParticipant =
    conv.user_id === user.id || conv.participant_a_id === user.id || conv.participant_b_id === user.id
  if (!isParticipant && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: msg, error } = await service()
    .from('private_messages')
    .insert({ conversation_id: params.id, sender_id: user.id, content: content.trim(), reply_to_id: reply_to_id || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Smart delayed notification — fire and forget
  ;(async () => {
    try {
      const { maybeNotifyPrivateMessage } = await import('@/lib/notifications')
      const senderName = senderProfile?.name ?? senderProfile?.email ?? 'Utilizator'
      const text = content.trim()

      if (conv.participant_a_id && conv.participant_b_id) {
        // New-style: notify the other participant
        const recipientId = conv.participant_a_id === user.id
          ? conv.participant_b_id
          : conv.participant_a_id
        await maybeNotifyPrivateMessage(params.id, recipientId, senderName, text)
      } else if (isAdmin) {
        // Old-style admin → cursant
        const cursantId = conv.user_id ?? conv.participant_a_id
        if (cursantId) await maybeNotifyPrivateMessage(params.id, cursantId, senderName, text)
      } else {
        // Old-style cursant → all admins
        const { data: admins } = await service()
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
        for (const admin of admins ?? []) {
          await maybeNotifyPrivateMessage(params.id, admin.id, senderName, text)
        }
      }
    } catch {}
  })()

  return NextResponse.json(msg)
}
