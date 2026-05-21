import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChatClient from '@/components/chat/ChatClient'
import type { ChatMessage } from '@/lib/types'

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const SELECT = [
  '*',
  'sender:profiles!sender_id(id, name, email, role)',
  'reactions:group_chat_reactions(emoji, user_id)',
  'reply_to:group_chat_messages!reply_to_id(id, body, image_url, sender:profiles!sender_id(name, email))',
].join(', ')

export default async function ChatPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  // Service client bypasses profiles RLS so the sender JOIN works for all users
  const service = serviceClient()
  const { data } = await service
    .from('group_chat_messages')
    .select(SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(60)

  const msgs = (data ?? []) as unknown as Record<string, unknown>[]

  // PostgREST self-referential join requires a FK constraint on reply_to_id.
  // If that FK is missing the join returns null/{}. Manually fill in reply_to.
  const replyIds = Array.from(new Set(
    msgs
      .filter(m => m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id)
      .map(m => m.reply_to_id as string)
  ))

  let replyMap = new Map<string, Record<string, unknown>>()
  if (replyIds.length) {
    const { data: originals } = await service
      .from('group_chat_messages')
      .select('id, body, image_url, sender:profiles!sender_id(name, email)')
      .in('id', replyIds)
    if (originals?.length) {
      replyMap = new Map(originals.map((r: Record<string, unknown>) => [r.id as string, r]))
    }
  }

  const enriched = msgs.map(m =>
    m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id
      ? { ...m, reply_to: replyMap.get(m.reply_to_id as string) ?? null }
      : m
  )

  const initialMessages = (enriched as unknown as ChatMessage[]).reverse()

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar profile={profile} />
      <ChatClient
        initialMessages={initialMessages}
        userId={user.id}
        userRole={profile.role}
      />
    </div>
  )
}
