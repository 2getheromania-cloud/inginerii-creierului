import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProfilClient from '@/components/profil/ProfilClient'
import PushSettings from '@/components/admin/PushSettings'

export default async function ProfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  return (
    <AppShell profile={profile}>
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profilul meu</h1>
        <ProfilClient profile={profile} />
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Notificări push</h2>
          <PushSettings />
        </div>
      </div>
    </AppShell>
  )
}
