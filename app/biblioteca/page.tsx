import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import VideoCard from '@/components/biblioteca/VideoCard'
import BibliotecaFilters from '@/components/biblioteca/BibliotecaFilters'
import { getPhaseFromWeek } from '@/lib/program'
import type { VideoResource, ProtocolFlags } from '@/lib/types'

function service() {
  return supa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function BibliotecaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/dashboard')

  const phase = getPhaseFromWeek(profile.week)
  const flags = profile.flags as ProtocolFlags
  const activeProtocols = Object.entries(flags).filter(([, v]) => v).map(([k]) => k)

  const { data: allVideos } = await service()
    .from('video_resources')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const videos = ((allVideos ?? []) as VideoResource[]).filter(v => {
    if (v.target_type === 'all') return true
    if (v.target_type === 'phase') return v.target_value === phase
    if (v.target_type === 'protocol') return activeProtocols.includes(v.target_value ?? '')
    return false
  })

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bibliotecă video</h1>
            <p className="text-gray-500 text-sm mt-0.5">Resurse video personalizate pentru faza ta — {phase}</p>
          </div>
          {profile.role === 'admin' && (
            <a href="/admin/biblioteca" className="btn-secondary text-sm">
              Gestionează resurse →
            </a>
          )}
        </div>

        <BibliotecaFilters videos={videos} />
      </div>
    </AppShell>
  )
}
