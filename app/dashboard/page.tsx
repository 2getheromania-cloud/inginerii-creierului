import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DailyChecklistForm from '@/components/dashboard/DailyChecklistForm'
import { todayISO } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_COLORS, PROTOCOL_LABELS, PROTOCOL_LINKS } from '@/lib/program'
import type { DailyReport, ProtocolFlags } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Eroare la încărcarea profilului. Reîncarcă pagina.</p>
      </div>
    )
  }

  const today = todayISO()
  const { data: todayReport } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const phase = getPhaseFromWeek(profile.week)
  const phaseColor = PHASE_COLORS[phase]
  const activeFlags = Object.entries(profile.flags as ProtocolFlags)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof ProtocolFlags)

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bună, {profile.name || 'cursant'}!
            </h1>
            <p className="text-gray-500">Astăzi este o oportunitate nouă de a-ți transforma microbiomul.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${phaseColor} text-sm px-3 py-1`}>{phase}</span>
            <span className="badge bg-gray-100 text-gray-700 text-sm px-3 py-1">
              Săptămâna {profile.week}/24
            </span>
          </div>
        </div>

        {activeFlags.length > 0 && (
          <div className="card bg-amber-50 border-amber-100">
            <p className="text-sm font-semibold text-amber-800 mb-2">Protocoale personalizate active:</p>
            <div className="flex flex-wrap gap-2">
              {activeFlags.map(flag => (
                <a
                  key={flag}
                  href={PROTOCOL_LINKS[flag]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                >
                  {PROTOCOL_LABELS[flag]} →
                </a>
              ))}
            </div>
          </div>
        )}

        <DailyChecklistForm
          profile={profile}
          existingReport={todayReport as DailyReport | null}
        />
      </div>
    </AppShell>
  )
}
