import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import NotificariClient from '@/components/admin/NotificariClient'
import type { Profile } from '@/lib/types'

export default async function NotificariPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [{ data: cursanti }, { data: admini }, { data: recent }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').eq('role', 'cursant').order('name'),
    supabase.from('profiles').select('id, name, email').eq('role', 'admin').order('name'),
    supabase.from('notifications').select('*').order('sent_at', { ascending: false }).limit(20),
  ])

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Notificări</h1>
        <NotificariClient
          cursanti={(cursanti ?? []) as Pick<Profile, 'id' | 'name' | 'email'>[]}
          admini={(admini ?? []) as Pick<Profile, 'id' | 'name' | 'email'>[]}
          recentNotifications={recent ?? []}
        />
      </div>
    </AppShell>
  )
}
