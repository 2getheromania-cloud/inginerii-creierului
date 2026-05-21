import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AdminBibliotecaClient from '@/components/admin/AdminBibliotecaClient'
import Link from 'next/link'
import type { VideoResource } from '@/lib/types'

function service() {
  return supa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function AdminBibliotecaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: videos } = await service()
    .from('video_resources')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
              ← Înapoi la admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Bibliotecă video</h1>
            <p className="text-gray-500 text-sm">Gestionează resursele video pentru cursanți.</p>
          </div>
          <Link href="/biblioteca" className="btn-secondary text-sm">
            Previzualizare cursant →
          </Link>
        </div>

        <AdminBibliotecaClient initial={(videos ?? []) as VideoResource[]} />
      </div>
    </AppShell>
  )
}
