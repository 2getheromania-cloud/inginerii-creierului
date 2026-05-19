import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProgressChart from '@/components/charts/ProgressChart'
import AdminCursantClient from '@/components/admin/AdminCursantClient'
import { formatDate } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_COLORS, PROTOCOL_LABELS } from '@/lib/program'
import type { Profile, DailyReport, ProtocolFlags } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminCursantPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const myProfile = await getOrCreateProfile(user.id, user.email!)
  if (!myProfile || myProfile.role !== 'admin') redirect('/dashboard')

  const { data: cursantProfile } = await supabase.from('profiles').select('*').eq('id', params.id).single()
  if (!cursantProfile) notFound()

  const [{ data: reports30 }, { data: reports7 }] = await Promise.all([
    supabase.from('daily_reports').select('*').eq('user_id', params.id).order('date', { ascending: false }).limit(30),
    supabase.from('daily_reports').select('*').eq('user_id', params.id).order('date', { ascending: false }).limit(7),
  ])

  const phase = getPhaseFromWeek(cursantProfile.week)
  const activeFlags = Object.entries(cursantProfile.flags as ProtocolFlags)
    .filter(([, v]) => v).map(([k]) => k as keyof ProtocolFlags)

  return (
    <AppShell profile={myProfile}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
              ← Înapoi la admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{cursantProfile.name || cursantProfile.email}</h1>
            <p className="text-gray-500">{cursantProfile.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn('badge text-sm px-3 py-1', PHASE_COLORS[phase])}>{phase}</span>
            <span className="badge bg-gray-100 text-gray-700 text-sm px-3 py-1">Săpt. {cursantProfile.week}/24</span>
          </div>
        </div>

        <AdminCursantClient profile={cursantProfile as Profile} />

        {activeFlags.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-3">Protocoale active</h3>
            <div className="flex flex-wrap gap-2">
              {activeFlags.map(f => (
                <span key={f} className="badge bg-amber-100 text-amber-800">{PROTOCOL_LABELS[f]}</span>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-4">Ultimele 7 zile — indicatori</h3>
          {(reports7?.length ?? 0) > 0
            ? <ProgressChart reports={(reports7 ?? []) as DailyReport[]} type="line" days={7} />
            : <p className="text-sm text-gray-400">Nu există rapoarte recente.</p>
          }
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Ultimele 30 zile — completare checklist</h3>
          {(reports30?.length ?? 0) > 0
            ? <ProgressChart reports={(reports30 ?? []) as DailyReport[]} type="bar" days={30} />
            : <p className="text-sm text-gray-400">Nu există rapoarte în ultimele 30 de zile.</p>
          }
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Rapoarte recente (30 zile)</h3>
          {(reports30?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Niciun raport.</p>
          ) : (
            <div className="space-y-2">
              {(reports30 ?? []).map((r: DailyReport) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{formatDate(r.date)}</span>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>E: {r.sliders.energie}</span>
                    <span>S: {r.sliders.somn}</span>
                    <span>St: {r.sliders.stres}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
