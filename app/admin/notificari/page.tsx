import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import NotificariClient from '@/components/admin/NotificariClient'
import type { Profile } from '@/lib/types'

export default async function NotificariPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const { data: cursanti } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'cursant')
    .order('name', { ascending: true })

  const { data: recent } = await supabase
    .from('notifications')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(20)

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Notificări</h1>
        <NotificariClient
          cursanti={(cursanti ?? []) as Pick<Profile, 'id' | 'name' | 'email'>[]}
          recentNotifications={recent ?? []}
        />
      </div>
    </AppShell>
  )
}
