import { createClient as supa, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// PostgREST self-referential joins require a FK constraint on reply_to_id.
// If that FK is missing the join returns null/{}. This manually fills it in.
async function enrichWithReplies(msgs: Record<string, unknown>[], svc: SupabaseClient) {
  const ids = Array.from(new Set(
    msgs
      .filter(m => m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id)
      .map(m => m.reply_to_id as string)
  ))
  if (!ids.length) return msgs

  const { data: originals } = await svc
    .from('private_messages')
    .select('id, content, sender_id')
    .in('id', ids)

  if (!originals?.length) return msgs

  const byId = new Map(originals.map((r: Record<string, unknown>) => [r.id as string, r]))
  return msgs.map(m =>
    m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id
      ? { ...m, reply_to: byId.get(m.reply_to_id as string) ?? null }
      : m
  )
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

  const svcClient = service()

  // Verify participation using service role (bypasses RLS entirely)
  const { data: conv, error: convErr } = await svcClient
    .from('conversations')
    .select('user_id, participant_a_id, participant_b_id')
    .eq('id', params.id)
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: profile } = await svcClient.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const isParticipant =
    conv.user_id === user.id || conv.participant_a_id === user.id || conv.participant_b_id === user.id

  if (!isParticipant && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch messages with service role (bypasses RLS, same as Realtime channel check)
  const { data: msgs, error: msgsErr } = await svcClient
    .from('private_messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(200)

  if (msgsErr) {
    return NextResponse.json({ error: msgsErr.message }, { status: 500 })
  }

  if (!msgs?.length) return NextResponse.json([])

  // Fetch reactions with service role (no sensitive data, avoids RLS complexity)
  const svc = svcClient
  const msgIds = msgs.map((m: Record<string, unknown>) => m.id as string)
  const { data: reactions } = await svc
    .from('private_message_reactions')
    .select('message_id, emoji, user_id')
    .in('message_id', msgIds)

  const reactMap = new Map<string, { emoji: string; user_id: string }[]>()
  for (const r of (reactions ?? []) as { message_id: string; emoji: string; user_id: string }[]) {
    const arr = reactMap.get(r.message_id) ?? []
    arr.push({ emoji: r.emoji, user_id: r.user_id })
    reactMap.set(r.message_id, arr)
  }

  const withReactions = msgs.map((m: Record<string, unknown>) => ({
    ...m,
    reactions: reactMap.get(m.id as string) ?? [],
  }))

  const enriched = await enrichWithReplies(withReactions as Record<string, unknown>[], svc)
  return NextResponse.json(enriched)
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

  // Notifications — kept alive after response via waitUntil
  waitUntil((async () => {
    const { sendPushToUser } = await import('@/lib/push')
    const { maybeNotifyPrivateMessage } = await import('@/lib/notifications')
    const senderName = senderProfile?.name ?? senderProfile?.email ?? 'Utilizator'
    const preview = content.trim().slice(0, 100)

    async function notifyRecipient(recipientId: string) {
      try {
        await sendPushToUser(recipientId, { title: senderName, body: preview, url: '/mesaje' })
      } catch (e) { console.error('[PUSH] sendPush error:', e) }
      try {
        await maybeNotifyPrivateMessage(params.id, recipientId, senderName, preview)
      } catch (e) { console.error('[PUSH] email fallback error:', e) }
    }

    try {
      if (conv.participant_a_id && conv.participant_b_id) {
        const recipientId = conv.participant_a_id === user.id
          ? conv.participant_b_id
          : conv.participant_a_id
        console.log(`[PUSH] new-style conv, notifying recipientId=${recipientId}`)
        await notifyRecipient(recipientId)
      } else if (isAdmin) {
        const cursantId = conv.user_id ?? conv.participant_a_id
        if (cursantId) {
          console.log(`[PUSH] old-style conv, admin sends, notifying cursantId=${cursantId}`)
          await notifyRecipient(cursantId)
        }
      } else {
        const { data: admins } = await service()
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
        console.log(`[PUSH] old-style conv, cursant sends, notifying ${admins?.length ?? 0} admins`)
        for (const admin of admins ?? []) {
          await notifyRecipient(admin.id)
        }
      }
    } catch (e) { console.error('[PUSH] notification routing error:', e) }
  })())

  return NextResponse.json(msg)
}
