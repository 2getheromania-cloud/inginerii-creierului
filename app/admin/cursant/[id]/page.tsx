import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect, notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProgressChart from '@/components/charts/ProgressChart'
import AdminCursantClient from '@/components/admin/AdminCursantClient'
import AdminPrivateChatClient from '@/components/admin/AdminPrivateChatClient'
import AdminInsightCard from '@/components/admin/AdminInsightCard'
import DeleteUserButton from '@/components/admin/DeleteUserButton'
import DocumenteClient from '@/components/documente/DocumenteClient'
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
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { getOrCreateConversation } from '@/lib/conversations'

const GENERAL_KEYS = [
  'Suplimente Microbiom',
  'Materiale suport curs',
  'Somn & recuperare',
  'Gestionarea stresului',
] as const

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

  const conversationId = await getOrCreateConversation(params.id, user.id)

  const phase        = getPhaseFromWeek(cursantProfile.week)
  const flags        = cursantProfile.flags as ProtocolFlags
  const activeFlags  = Object.entries(flags).filter(([, v]) => v).map(([k]) => k as keyof ProtocolFlags)
  const recipeConfig = PHASE_RECIPE_CONFIGS[phase]

  const generalLinks = GENERAL_MATERIALS.filter(m =>
    (GENERAL_KEYS as readonly string[]).includes(m.title) ||
    (flags.tiroida && m.title === 'Suplimente Tiroidă')
  )

  const userName = cursantProfile.name ?? cursantProfile.email

  return (
    <AppShell profile={myProfile}>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
              ← Înapoi la admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
            <p className="text-gray-500">{cursantProfile.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn('badge text-sm px-3 py-1', PHASE_COLORS[phase])}>{phase}</span>
            <span className="badge bg-gray-100 text-gray-700 text-sm px-3 py-1">Săpt. {cursantProfile.week}/24</span>
          </div>
        </div>

        {/* ── Sinteză inteligentă ── */}
        <AdminInsightCard
          reports7={(reports7 ?? []) as DailyReport[]}
          reports30={(reports30 ?? []) as DailyReport[]}
        />

        {/* ── Edit profile ── */}
        <AdminCursantClient profile={cursantProfile as Profile} />

        {/* ── Chat privat ── */}
        <div className="card">
          <h3 className="font-semibold mb-4">Chat privat cu {userName}</h3>
          <div className="h-80 flex flex-col border border-gray-200 rounded-xl overflow-hidden">
            <AdminPrivateChatClient conversationId={conversationId} currentUserId={user.id} />
          </div>
        </div>

        {/* ── Protocoale active ── */}
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

        {/* ── Charts ── */}
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

        {/* ── Reports table ── */}
        <div className="card">
          <h3 className="font-semibold mb-4">Rapoarte recente (30 zile)</h3>
          {(reports30?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400">Niciun raport.</p>
          ) : (
            <div className="space-y-2">
              {(reports30 ?? []).map((r: DailyReport) => (
                <div key={r.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{formatDate(r.date)}</span>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>E: {r.sliders.energie}</span>
                      <span>S: {r.sliders.somn}</span>
                      <span>St: {r.sliders.stres}</span>
                    </div>
                  </div>
                  {r.note && <p className="text-xs text-gray-500 mt-1 italic">"{r.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Documente cursant ── */}
        <div className="card">
          <h3 className="font-semibold mb-4">Documente cursant</h3>
          <DocumenteClient userId={user.id} isAdmin={true} targetUserId={cursantProfile.id} />
        </div>

        {/* ── Resurse curente ── */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-5">Resurse curente</h3>

          {/* Rețete fază */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Rețete &amp; materiale fază — {phase}
            </p>
            <div className="flex flex-wrap gap-2">
              {recipeConfig.kind === 'dual' ? (
                <>
                  <a
                    href={recipeConfig.vegetarian}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors text-sm font-medium"
                  >
                    🥦 Rețete Vegetarian →
                  </a>
                  <a
                    href={recipeConfig.omnivor}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-colors text-sm font-medium"
                  >
                    🥩 Rețete Omnivor →
                  </a>
                </>
              ) : (
                <a
                  href={recipeConfig.url}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 hover:border-brand-300 transition-colors text-sm font-medium"
                >
                  📄 {recipeConfig.label ?? 'Materiale fază'} →
                </a>
              )}
            </div>
          </div>

          {/* Protocoale active cu linkuri */}
          {activeFlags.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Protocoale active</p>
              <div className="flex flex-wrap gap-2">
                {activeFlags.map(f => (
                  <a
                    key={f}
                    href={PROTOCOL_LINKS[f]}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-colors text-sm font-medium"
                  >
                    ⚡ {PROTOCOL_LABELS[f]} →
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Materiale generale */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Materiale generale</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {generalLinks.map(m => (
                <a
                  key={m.title}
                  href={m.url}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
                >
                  <span className="text-xl flex-shrink-0">{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700 transition-colors">
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.desc}</p>
                  </div>
                  <span className="ml-auto text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="border-t border-red-100 pt-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-4">
            Zonă periculoasă
          </p>

          {/* ── Acțiuni administrative ── */}
          <div className="card border border-red-200 bg-red-50/30">
            <h3 className="font-semibold text-gray-800 mb-1">Acțiuni administrative</h3>
            <p className="text-sm text-gray-500 mb-1">
              Ștergerea unui cursant este <strong>ireversibilă</strong>. Vor fi șterse:
            </p>
            <ul className="text-sm text-gray-500 list-disc list-inside mb-4 space-y-0.5">
              <li>Toate rapoartele zilnice</li>
              <li>Profilul cursantului</li>
              <li>Contul de autentificare</li>
            </ul>
            <DeleteUserButton userId={cursantProfile.id} userName={userName} />
          </div>
        </div>

      </div>
    </AppShell>
  )
}
