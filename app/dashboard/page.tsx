import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import DailyChecklistForm from '@/components/dashboard/DailyChecklistForm'
import AdminMessageCard from '@/components/dashboard/AdminMessageCard'
import MotivationalCard from '@/components/dashboard/MotivationalCard'
import WeeklySummaryCard from '@/components/dashboard/WeeklySummaryCard'
import CommunityWinsCard from '@/components/dashboard/CommunityWinsCard'
import { todayISO, calcStreak } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_COLORS, PROTOCOL_LABELS, PROTOCOL_LINKS } from '@/lib/program'
import type { DailyReport, ProtocolFlags, AdminMessage } from '@/lib/types'

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
  const phase = getPhaseFromWeek(profile.week)
  const flags = profile.flags as ProtocolFlags
  const activeFlags = Object.entries(flags).filter(([, v]) => v).map(([k]) => k as keyof ProtocolFlags)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [
    { data: todayReport },
    { data: recentReports },
    { data: messagesRaw },
    { data: groupStatsRaw },
    { data: allReports },
  ] = await Promise.all([
    supabase.from('daily_reports').select('*').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('daily_reports').select('date, sliders').eq('user_id', user.id).gte('date', sevenDaysAgoStr),
    supabase.from('admin_messages').select('*').eq('is_active', true).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }),
    supabase.rpc('get_group_stats_last7'),
    supabase.from('daily_reports').select('date').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
  ])

  const appStartDate = profile.app_start_date ?? null
  const allowBackfill = profile.allow_backfill ?? false

  // Count completed days in last 7 days only from app_start_date onwards
  const recentFiltered = appStartDate
    ? (recentReports ?? []).filter(r => r.date >= appStartDate)
    : (recentReports ?? [])
  const userDaysCompleted = recentFiltered.length

  const streak = calcStreak(allReports ?? [], appStartDate)
  const groupStats = groupStatsRaw as { avg_reports: number; max_reports: number; total_users: number } | null

  // Filter messages to only those relevant to this cursant
  const messages = ((messagesRaw ?? []) as AdminMessage[]).filter(m => {
    if (m.target_type === 'all') return true
    if (m.target_type === 'phase') return m.target_value === phase
    if (m.target_type === 'protocol') return flags[m.target_value as keyof ProtocolFlags] === true
    return false
  })

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bună, {profile.name || 'cursant'}!
            </h1>
            <p className="text-gray-500">Astăzi este o oportunitate nouă de a-ți transforma microbiomul.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${PHASE_COLORS[phase]} text-sm px-3 py-1`}>{phase}</span>
            <span className="badge bg-gray-100 text-gray-700 text-sm px-3 py-1">
              Săptămâna {profile.week}/24
            </span>
          </div>
        </div>

        {/* Admin messages (only relevant ones) */}
        {messages.map(m => (
          <AdminMessageCard key={m.id} message={m} />
        ))}

        {/* Motivational card */}
        <MotivationalCard
          daysCompleted={userDaysCompleted}
          avgGroup={groupStats?.avg_reports ?? null}
        />

        {/* Active protocols */}
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

        {streak > 0 && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-orange-700">{streak} {streak === 1 ? 'zi' : 'zile'} consecutive</p>
              <p className="text-xs text-orange-500">
                {streak >= 30 ? 'Legendă! 30 de zile!' : streak >= 21 ? '21 zile — incredibil!' : streak >= 14 ? '14 zile — excelent!' : streak >= 7 ? '7 zile — bravo!' : 'Continuă streak-ul!'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeeklySummaryCard
            reports={recentFiltered as { date: string; sliders?: Record<string, number> }[]}
            streak={streak}
          />
          <CommunityWinsCard
            avgReports={groupStats?.avg_reports ?? null}
            maxReports={groupStats?.max_reports ?? null}
            totalUsers={groupStats?.total_users ?? null}
            userDaysCompleted={userDaysCompleted}
          />
        </div>

        <DailyChecklistForm
          profile={profile}
          existingReport={todayReport as DailyReport | null}
          streak={streak}
          userId={user.id}
          allowBackfill={allowBackfill}
          appStartDate={appStartDate}
        />
      </div>
    </AppShell>
  )
}
