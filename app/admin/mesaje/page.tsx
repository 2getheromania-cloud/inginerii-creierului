import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AdminMesajeClient from '@/components/admin/AdminMesajeClient'
import Link from 'next/link'
import type { AdminMessage } from '@/lib/types'

export default async function AdminMesajePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: messages } = await supabase
    .from('admin_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
            ← Înapoi la admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mesaje pentru cursanți</h1>
          <p className="text-gray-500 text-sm mt-1">
            Creează mesaje cu resurse, videouri sau anunțuri. Apar în dashboard-ul cursanților targetați.
          </p>
        </div>

        <AdminMesajeClient messages={(messages ?? []) as AdminMessage[]} />
      </div>
    </AppShell>
  )
}
