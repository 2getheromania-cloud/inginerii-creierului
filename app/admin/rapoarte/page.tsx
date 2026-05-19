import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import RapoarteClient from '@/components/admin/RapoarteClient'
import type { Profile } from '@/lib/types'

export default async function RapoartePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: cursanti } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'cursant')
    .order('name')

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Export rapoarte</h1>
        <RapoarteClient cursanti={(cursanti ?? []) as Pick<Profile, 'id' | 'name' | 'email'>[]} />
      </div>
    </AppShell>
  )
}
