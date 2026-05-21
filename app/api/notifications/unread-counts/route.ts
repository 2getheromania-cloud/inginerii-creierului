import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function service() {
  return supa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = service()

  // ── Community count ──────────────────────────────────────────────────────────
  let communityCount = 0
  let latestCommunity: {
    messageId: string; isAdmin: boolean; isAnnouncement: boolean; preview: string
  } | null = null

  try {
    const { data: prof } = await db
      .from('profiles')
      .select('community_last_seen_at')
      .eq('id', user.id)
      .single()

    const lastSeen: string = (prof as { community_last_seen_at: string | null } | null)
      ?.community_last_seen_at ?? new Date(0).toISOString()

    const { count, data: commMsgs } = await db
      .from('group_chat_messages')
      .select('id, body, is_announcement, sender:profiles!sender_id(role)', { count: 'exact' })
      .is('deleted_at', null)
      .neq('sender_id', user.id)
      .gt('created_at', lastSeen)
      .order('created_at', { ascending: false })
      .limit(1)

    communityCount = count ?? 0

    if (commMsgs && commMsgs.length > 0) {
      const m = commMsgs[0] as unknown as {
        id: string
        body: string | null
        is_announcement: boolean | null
        sender: { role: string } | { role: string }[] | null
      }
      const senderRole = Array.isArray(m.sender) ? m.sender[0]?.role : m.sender?.role
      latestCommunity = {
        messageId: m.id,
        isAdmin: senderRole === 'admin',
        isAnnouncement: m.is_announcement ?? false,
        preview: String(m.body ?? '').slice(0, 80),
      }
    }
  } catch {}

  // ── Private count ────────────────────────────────────────────────────────────
  let privateCount = 0
  let latestPrivate: {
    messageId: string; senderName: string; preview: string; conversationId: string
  } | null = null

  try {
    const { data: convRows } = await db
      .from('conversations')
      .select('id')
      .or(
        `participant_a_id.eq.${user.id},participant_b_id.eq.${user.id},user_id.eq.${user.id}`
      )

    const convIds = ((convRows ?? []) as { id: string }[]).map(c => c.id)

    if (convIds.length > 0) {
      const { count, data: unreadMsgs } = await db
        .from('private_messages')
        .select('id, content, conversation_id, sender_id', { count: 'exact' })
        .in('conversation_id', convIds)
        .eq('read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      privateCount = count ?? 0

      if (unreadMsgs && unreadMsgs.length > 0) {
        const msg = unreadMsgs[0] as {
          id: string; content: string; conversation_id: string; sender_id: string
        }
        const { data: sender } = await db
          .from('profiles')
          .select('name, email')
          .eq('id', msg.sender_id)
          .single()

        const s = sender as { name: string | null; email: string } | null
        latestPrivate = {
          messageId: msg.id,
          senderName: s?.name ?? s?.email ?? 'Utilizator',
          preview: String(msg.content ?? '').slice(0, 80),
          conversationId: msg.conversation_id,
        }
      }
    }
  } catch {}

  return NextResponse.json({ privateCount, communityCount, latestPrivate, latestCommunity })
}
