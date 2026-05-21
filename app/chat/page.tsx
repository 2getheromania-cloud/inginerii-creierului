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
    .select('*, sender:profiles!sender_id(id, name, email, role)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(60)

  const initialMessages = ((data ?? []) as ChatMessage[]).reverse()

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
