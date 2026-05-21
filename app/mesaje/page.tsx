import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import MesajeClient from '@/components/mesaje/MesajeClient'
import { getOrCreateConversation } from '@/lib/conversations'

export default async function MesajePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role === 'admin') redirect('/dashboard')

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
