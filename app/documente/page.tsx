import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DocumenteClient from '@/components/documente/DocumenteClient'

export default async function DocumentePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentele mele</h1>
        <div className="card">
          <DocumenteClient userId={user.id} isAdmin={profile.role === 'admin'} />
        </div>
      </div>
    </AppShell>
  )
}
