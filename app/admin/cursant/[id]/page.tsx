import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProgressChart from '@/components/charts/ProgressChart'
import AdminCursantClient from '@/components/admin/AdminCursantClient'
import { formatDate } from '@/lib/utils'
import {
  getPhaseFromWeek,
  PHASE_COLORS,
  PROTOCOL_LABELS,
  PROTOCOL_LINKS,
  PHASE_RECIPE_CONFIGS,
  GENERAL_MATERIALS,
} from '@/lib/program'
import type { Profile, DailyReport, ProtocolFlags } from '@/lib/types'
import DeleteUserButton from '@/components/admin/DeleteUserButton'
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

  const phase       = getPhaseFromWeek(cursantProfile.week)
  const flags       = cursantProfile.flags as ProtocolFlags
  const activeFlags = Object.entries(flags).filter(([, v]) => v).map(([k]) => k as keyof ProtocolFlags)
  const recipeConfig = PHASE_RECIPE_CONFIGS[phase]

  const GENERAL_KEYS = ['Suplimente Microbiom', 'Materiale suport curs', 'Somn & recuperare', 'Gestionarea stresului'] as const
  const generalLinks = GENERAL_MATERIALS.filter(m =>
    (GENERAL_KEYS as readonly string[]).includes(m.title) ||
    (flags.tiroida && m.title === 'Suplimente Tiroidă')
  )

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

        {/* ── Resurse curente ── */}
        <div className="card">
          <h3 className="font-semibold mb-4">Resurse curente</h3>
          <div className="space-y-4">

            {/* Rețete fază */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rețete &amp; materiale fază</p>
              <div className="flex flex-wrap gap-2">
                {recipeConfig.kind === 'single' ? (
                  <a href={recipeConfig.url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-sm">
                    {recipeConfig.label ?? 'Rețete curente'} →
                  </a>
                ) : (
                  <>
                    <a href={recipeConfig.vegetarian} target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-sm">
                      Vegetarian →
                    </a>
                    <a href={recipeConfig.omnivor} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-sm">
                      Omnivor →
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Protocoale active */}
            {activeFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Protocoale active</p>
                <div className="flex flex-wrap gap-2">
                  {activeFlags.map(f => (
                    <a key={f} href={PROTOCOL_LINKS[f]} target="_blank" rel="noopener noreferrer"
                      className="badge bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer">
                      {PROTOCOL_LABELS[f]} →
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Materiale generale */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Materiale generale</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {generalLinks.map(m => (
                  <a key={m.title} href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-sm text-gray-700 hover:text-brand-700">
                    <span>{m.icon}</span>
                    <span className="font-medium leading-tight">{m.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Acțiuni administrative ── */}
        <div className="card border border-red-100">
          <h3 className="font-semibold text-gray-800 mb-1">Acțiuni administrative</h3>
          <p className="text-sm text-gray-500 mb-4">Acțiunile de mai jos sunt ireversibile.</p>
          <DeleteUserButton
            userId={cursantProfile.id}
            userName={cursantProfile.name ?? cursantProfile.email}
          />
        </div>

      </div>
    </AppShell>
  )
}
