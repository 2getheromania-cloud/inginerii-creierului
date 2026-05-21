import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ConversatiiClient from '@/components/mesaje/ConversatiiClient'

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

  const isAdmin = profile.role === 'admin'

  // Admin sees everyone except self; cursant sees only admins
  let query = service()
    .from('profiles')
    .select('id, name, email, role')
    .neq('id', user.id)
    .order('name')

  if (!isAdmin) {
    query = query.eq('role', 'admin') as typeof query
  }

  const { data: users } = await query

  const userList = (users ?? []).map((u: { id: string; name: string | null; email: string; role: string }) => ({
    id: u.id,
    name: u.name ?? u.email,
    email: u.email,
    role: u.role as 'admin' | 'cursant',
  }))

  return (
    <AppShell profile={profile}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Mesaje private</h1>
        <ConversatiiClient
          users={userList}
          currentUserId={user.id}
          currentUserRole={profile.role}
        />
      </div>
    </AppShell>
  )
}
