'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getPhaseFromWeek, PHASE_COLORS, PROTOCOL_LABELS } from '@/lib/program'
import { formatDateShort } from '@/lib/utils'
import type { AdminStats, ProtocolFlags, ProgramPhase } from '@/lib/types'

type StatusFilter = 'all' | 'active' | 'inactive'

const ALL_PHASES: ProgramPhase[] = ['Detox 21', 'Tranziție', 'Faza 1', 'Faza 2', 'Faza 3', 'Faza 4']

export default function AdminCursantiClient({
  cursanti,
  total,
}: {
  cursanti: AdminStats[]
  total: number
}) {
  const [search, setSearch]             = useState('')
  const [phaseFilter, setPhaseFilter]   = useState<ProgramPhase | ''>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [protocolOnly, setProtocolOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = cursanti
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        (c.name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    }
    if (phaseFilter) list = list.filter(c => getPhaseFromWeek(c.week) === phaseFilter)
    if (statusFilter === 'active')   list = list.filter(c => c.days_since_report === 0)
    if (statusFilter === 'inactive') list = list.filter(c => (c.days_since_report ?? 99) >= 3)
    if (protocolOnly) list = list.filter(c => Object.values(c.flags as ProtocolFlags).some(Boolean))
    return list
  }, [cursanti, search, phaseFilter, statusFilter, protocolOnly])

  const hasFilters = search || phaseFilter || statusFilter !== 'all' || protocolOnly

  function resetFilters() {
    setSearch('')
    setPhaseFilter('')
    setStatusFilter('all')
    setProtocolOnly(false)
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* ── Filters ── */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input flex-1 min-w-[200px] text-sm"
          />
          <select
            value={phaseFilter}
            onChange={e => setPhaseFilter(e.target.value as ProgramPhase | '')}
            className="input w-auto text-sm"
          >
            <option value="">Toate fazele</option>
            {ALL_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                statusFilter === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              )}
            >
              {s === 'all' ? 'Toți' : s === 'active' ? '✓ Activi azi' : '⚠ Inactivi 3+ zile'}
            </button>
          ))}
          <button
            onClick={() => setProtocolOnly(v => !v)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
              protocolOnly
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
            )}
          >
            Protocoale active
          </button>
          {hasFilters && (
            <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
              Resetează
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400">
          {hasFilters
            ? `${filtered.length} din ${total} cursanți`
            : `${total} cursanți total`}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-6 py-3">Cursant</th>
              <th className="text-left px-6 py-3">Fază / Săpt.</th>
              <th className="text-left px-6 py-3">Protocoale</th>
              <th className="text-left px-6 py-3">Ultimul raport</th>
              <th className="text-left px-6 py-3">Ultimele 30z</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => {
              const phase      = getPhaseFromWeek(c.week)
              const daysSince  = c.days_since_report ?? null
              const protocols  = Object.entries(c.flags as ProtocolFlags)
                .filter(([, v]) => v)
                .map(([k]) => PROTOCOL_LABELS[k as keyof ProtocolFlags])
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{c.name || '—'}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('badge w-fit', PHASE_COLORS[phase])}>{phase}</span>
                    <p className="text-xs text-gray-500 mt-1">Săpt. {c.week}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {protocols.length === 0
                        ? <span className="text-xs text-gray-400">—</span>
                        : protocols.map(p => (
                          <span key={p} className="badge bg-amber-100 text-amber-700 text-xs">{p}</span>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {c.last_report_date ? (
                      <div>
                        <p className={cn('text-sm font-medium',
                          daysSince === 0     ? 'text-green-600'
                          : (daysSince ?? 99) >= 3 ? 'text-red-500'
                          : 'text-gray-700'
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
                      c.reports_last_30_days >= 20 ? 'bg-green-100 text-green-700'
                      : c.reports_last_30_days >= 10 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-600'
                    )}>
                      {c.reports_last_30_days}/30
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/cursant/${c.id}`} className="text-brand-600 text-sm hover:underline font-medium whitespace-nowrap">
                      Detalii →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-gray-400">
            {total === 0 ? 'Niciun cursant înregistrat.' : 'Niciun cursant corespunde filtrelor.'}
          </p>
        )}
      </div>
    </div>
  )
}
