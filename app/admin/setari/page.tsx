import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProtocolTypesManager from '@/components/admin/ProtocolTypesManager'

export default async function AdminSetariPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <AppShell profile={profile}>
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Setări</h1>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-5">Protocoale disponibile</h2>
          <ProtocolTypesManager />
        </div>
      </div>
    </AppShell>
  )
}
