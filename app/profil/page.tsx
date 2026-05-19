import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProfilClient from '@/components/profil/ProfilClient'
import type { Profile } from '@/lib/types'

export default async function ProfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/')

  return (
    <AppShell>
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profilul meu</h1>
        <ProfilClient profile={profile as Profile} />
      </div>
    </AppShell>
  )
}
