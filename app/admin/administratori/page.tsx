import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AdminRoleClient from '@/components/admin/AdminRoleClient'
import Link from 'next/link'

export default async function AdminiPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: admins } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
            ← Înapoi la admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Administratori</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestionează rolurile de administrator. Maxim 4 admini recomandați.
          </p>
        </div>

        <AdminRoleClient
          admins={(admins ?? []) as { id: string; name: string | null; email: string }[]}
          myId={user.id}
        />
      </div>
    </AppShell>
  )
}
