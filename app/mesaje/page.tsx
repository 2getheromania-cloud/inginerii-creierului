import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import MesajeClient from '@/components/mesaje/MesajeClient'
import AdminConversatiiClient from '@/components/mesaje/AdminConversatiiClient'
import { getOrCreateConversation } from '@/lib/conversations'

function service() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function MesajePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  if (profile.role === 'admin') {
    const { data: convRows } = await service()
      .from('conversations')
      .select('id, user_id, created_at, profiles!user_id(id, name, email)')
      .order('created_at', { ascending: false })

    const conversations = (convRows ?? []).map((c: {
      id: string
      user_id: string
      created_at: string
      profiles: { id: string; name: string | null; email: string }[] | { id: string; name: string | null; email: string } | null
    }) => {
      const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      return {
        id: c.id,
        userId: c.user_id,
        name: p?.name ?? p?.email ?? c.user_id,
        email: p?.email ?? '',
      }
    })

    return (
      <AppShell profile={profile}>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Mesaje private</h1>
          <AdminConversatiiClient conversations={conversations} adminId={user.id} />
        </div>
      </AppShell>
    )
  }

  const conversationId = await getOrCreateConversation(user.id)

  return (
    <AppShell profile={profile}>
      <div className="flex flex-col h-[calc(100vh-4rem)] -mt-6 -mx-4">
        <div className="px-4 pt-6 pb-3 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900">Mesaje cu echipa</h1>
          <p className="text-sm text-gray-500">Conversație privată cu adminul programului.</p>
        </div>
        <MesajeClient conversationId={conversationId} userId={user.id} userName={profile.name || profile.email} />
      </div>
    </AppShell>
  )
}
