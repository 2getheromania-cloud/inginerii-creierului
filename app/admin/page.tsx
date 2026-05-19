import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { formatDate, formatDateShort } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_COLORS, PROTOCOL_LABELS } from '@/lib/program'
import type { AdminStats, ProtocolFlags } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: stats } = await supabase.from('admin_stats').select('*').order('created_at', { ascending: false })
  const cursanti = (stats ?? []) as AdminStats[]

  const totalCursanti = cursanti.length
  const activeToday = cursanti.filter(c => c.last_report_date === new Date().toISOString().split('T')[0]).length
  const inactive3Plus = cursanti.filter(c => (c.days_since_report ?? 99) >= 3).length

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <div className="flex gap-2">
            <Link href="/admin/notificari" className="btn-secondary text-sm">Notificări</Link>
            <Link href="/admin/rapoarte" className="btn-secondary text-sm">Export CSV</Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total cursanți', value: totalCursanti, color: 'text-gray-900' },
            { label: 'Activi azi',     value: activeToday,   color: 'text-brand-600' },
            { label: 'Inactivi 3+ zile', value: inactive3Plus, color: 'text-red-600' },
            { label: 'Rată completare', value: `${Math.round((activeToday / (totalCursanti || 1)) * 100)}%`, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerte inactivitate */}
        {inactive3Plus > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-semibold text-red-700 mb-2">
              ⚠️ {inactive3Plus} cursant(ți) nu au raportat în ultimele 3+ zile
            </p>
            <div className="flex flex-wrap gap-2">
              {cursanti
                .filter(c => (c.days_since_report ?? 99) >= 3)
                .map(c => (
                  <Link key={c.id} href={`/admin/cursant/${c.id}`} className="text-sm text-red-700 hover:underline font-medium">
                    {c.name || c.email}
                  </Link>
                ))
              }
            </div>
          </div>
        )}

        {/* Tabel cursanți */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Toți cursanții ({totalCursanti})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3">Cursant</th>
                  <th className="text-left px-6 py-3">Fază / Săptămână</th>
                  <th className="text-left px-6 py-3">Protocoale</th>
                  <th className="text-left px-6 py-3">Ultimul raport</th>
                  <th className="text-left px-6 py-3">Ultimele 30z</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cursanti.map(c => {
                  const phase = getPhaseFromWeek(c.week)
                  const daysSince = c.days_since_report ?? null
                  const activeProtocols = Object.entries(c.flags as ProtocolFlags)
                    .filter(([, v]) => v)
                    .map(([k]) => PROTOCOL_LABELS[k as keyof ProtocolFlags])
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{c.name || '—'}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn('badge w-fit', PHASE_COLORS[phase])}>{phase}</span>
                          <span className="text-xs text-gray-500">Săpt. {c.week}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {activeProtocols.length === 0
                            ? <span className="text-xs text-gray-400">—</span>
                            : activeProtocols.map(p => (
                              <span key={p} className="badge bg-amber-100 text-amber-700 text-xs">{p}</span>
                            ))
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.last_report_date ? (
                          <div>
                            <p className={cn('text-sm font-medium',
                              daysSince === 0 ? 'text-green-600' :
                              (daysSince ?? 99) >= 3 ? 'text-red-500' : 'text-gray-700'
                            )}>
                              {formatDateShort(c.last_report_date)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {daysSince === 0 ? 'azi' : `acum ${daysSince} zile`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">niciodată</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('badge',
                          c.reports_last_30_days >= 20 ? 'bg-green-100 text-green-700' :
                          c.reports_last_30_days >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                        )}>
                          {c.reports_last_30_days}/30
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/cursant/${c.id}`} className="text-brand-600 text-sm hover:underline font-medium">
                          Detalii →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {cursanti.length === 0 && (
              <p className="text-center py-12 text-gray-400">Niciun cursant înregistrat.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
