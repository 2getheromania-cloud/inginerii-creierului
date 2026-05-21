'use client'
import { useState } from 'react'
import ProgressChart from '@/components/charts/ProgressChart'
import { formatDate, calcCompletionPct, getSliderColor } from '@/lib/utils'
import { SLIDER_LABELS } from '@/lib/program'
import { cn } from '@/lib/utils'
import type { DailyReport } from '@/lib/types'

const MONTH_NAMES = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie']
const DAY_ABBR   = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']

interface Props {
  reports: DailyReport[]
  appStartDate?: string | null
}

export default function IstoricClient({ reports, appStartDate }: Props) {
  const [period, setPeriod]       = useState<7 | 30 | 90>(30)
  const [activeTab, setActiveTab] = useState<'grafice' | 'calendar' | 'lista'>('grafice')

  // Calendar state — start at current month
  const now = new Date()
  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedISO, setSelectedISO] = useState<string | null>(null)

  const filtered = reports.slice(0, period)

  // Build report lookup map
  const reportMap = new Map(reports.map(r => [r.date, r]))

  // Calendar helpers
  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelectedISO(null)
  }
  function nextMonth() {
    const todayMY = [now.getFullYear(), now.getMonth()]
    if (calYear === todayMY[0] && calMonth === todayMY[1]) return
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelectedISO(null)
  }

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth()
  const firstDay  = new Date(calYear, calMonth, 1)
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  // Romania: week starts Monday. getDay() 0=Sun → offset 6, 1=Mon → 0, etc.
  const offsetStart = (firstDay.getDay() + 6) % 7

  const todayISO = now.toISOString().split('T')[0]

  const cells: (string | null)[] = []
  for (let i = 0; i < offsetStart; i++) cells.push(null)
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(calYear, calMonth, i + 1)
    cells.push(d.toISOString().split('T')[0])
  }

  const selectedReport = selectedISO ? reportMap.get(selectedISO) ?? null : null

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['grafice', 'calendar', 'lista'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab === 'grafice' ? 'Grafice' : tab === 'calendar' ? 'Calendar' : 'Listă'}
          </button>
        ))}
        {activeTab !== 'calendar' && (
          <div className="ml-auto flex gap-1">
            {([7, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  period === d ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {d}z
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── GRAFICE ── */}
      {activeTab === 'grafice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Zile raportate',   value: filtered.length },
              { label: 'Medie completare', value: `${Math.round(filtered.reduce((s, r) => s + calcCompletionPct(r.checks as unknown as Record<string, unknown>), 0) / (filtered.length || 1))}%` },
              { label: 'Medie energie',    value: (filtered.reduce((s, r) => s + (r.sliders.energie || 0), 0) / (filtered.length || 1)).toFixed(1) },
              { label: 'Medie somn',       value: (filtered.reduce((s, r) => s + (r.sliders.somn || 0), 0) / (filtered.length || 1)).toFixed(1) },
            ].map(stat => (
              <div key={stat.label} className="card text-center">
                <div className="text-2xl font-bold text-brand-600">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Completare checklist</h3>
            <ProgressChart reports={filtered} type="bar" days={period} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Indicatori de stare</h3>
            <ProgressChart reports={filtered} type="line" days={period} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Comparație săptămâni</h3>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(SLIDER_LABELS) as string[]).map(key => {
                const label = SLIDER_LABELS[key]
                const thisWeek = reports.slice(0, 7)
                const prevWeek = reports.slice(7, 14)
                const sliderVal = (r: DailyReport) => (r.sliders as unknown as Record<string, number>)[key] ?? 0
                const avgArr = (arr: DailyReport[]) => arr.length ? arr.reduce((s, r) => s + sliderVal(r), 0) / arr.length : 0
                const curr = avgArr(thisWeek)
                const prev = avgArr(prevWeek)
                const diff = curr - prev
                if (curr === 0 && prev === 0) return null
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-gray-800">{curr.toFixed(1)}</p>
                    {prev > 0 && (
                      <p className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)} față de săpt. anterioară
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="card">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="Luna anterioară"
              >
                ←
              </button>
              <h3 className="font-semibold text-gray-800">
                {MONTH_NAMES[calMonth]} {calYear}
              </h3>
              <button
                onClick={nextMonth}
                disabled={isCurrentMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30"
                aria-label="Luna următoare"
              >
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_ABBR.map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, idx) => {
                if (!iso) return <div key={`empty-${idx}`} />

                const hasReport = reportMap.has(iso)
                const isToday   = iso === todayISO
                const isSelected = iso === selectedISO
                const isBeforeStart = appStartDate ? iso < appStartDate : false
                const isFuture  = iso > todayISO

                let cellClass = 'aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-colors select-none '
                if (isFuture) {
                  cellClass += 'text-gray-200 cursor-default'
                } else if (isBeforeStart) {
                  cellClass += 'text-gray-300 cursor-default'
                } else if (isSelected) {
                  cellClass += 'bg-brand-600 text-white ring-2 ring-brand-400 cursor-pointer'
                } else if (hasReport) {
                  cellClass += 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer'
                } else {
                  cellClass += 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                }

                if (isToday && !isSelected) cellClass += ' ring-2 ring-brand-300'

                return (
                  <button
                    key={iso}
                    className={cellClass}
                    disabled={isFuture || isBeforeStart}
                    onClick={() => {
                      if (hasReport) setSelectedISO(prev => prev === iso ? null : iso)
                    }}
                    title={iso}
                  >
                    {new Date(iso + 'T12:00:00').getDate()}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 justify-center flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded bg-brand-500 inline-block" /> Raportat
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Neraportat
              </span>
              {appStartDate && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> Înainte de start
                </span>
              )}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedISO && selectedReport && (
            <div className="card border-brand-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{formatDate(selectedISO)}</h4>
                <button
                  onClick={() => setSelectedISO(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl font-bold text-brand-600">
                  {calcCompletionPct(selectedReport.checks as unknown as Record<string, unknown>)}%
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{ width: `${calcCompletionPct(selectedReport.checks as unknown as Record<string, unknown>)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(Object.keys(SLIDER_LABELS) as string[]).map(key => {
                  const val = (selectedReport.sliders as unknown as Record<string, number>)[key]
                  if (val === undefined || val === null) return null
                  return (
                    <div key={key} className="text-center bg-gray-50 rounded-xl py-2">
                      <div className={cn('text-lg font-bold', getSliderColor(val))}>{val}</div>
                      <div className="text-xs text-gray-400">{SLIDER_LABELS[key]}</div>
                    </div>
                  )
                })}
              </div>
              {selectedReport.symptoms.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Simptome:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.symptoms.map((s, i) => (
                      <span key={i} className="badge bg-red-50 text-red-700 text-xs">{s.name} ({s.severity}/10)</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedReport.note && (
                <p className="mt-2 text-sm text-gray-600 italic">"{selectedReport.note}"</p>
              )}
            </div>
          )}

          {selectedISO && !selectedReport && (
            <div className="card border-gray-200 text-center py-6 text-gray-400 text-sm">
              Nu există raport pentru {formatDate(selectedISO)}.
            </div>
          )}
        </div>
      )}

      {/* ── LISTA ── */}
      {activeTab === 'lista' && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card text-center text-gray-400 py-12">
              Nu ai rapoarte în această perioadă.
            </div>
          )}
          {filtered.map(report => {
            const pct = calcCompletionPct(report.checks as unknown as Record<string, unknown>)
            return (
              <details key={report.id} className="card cursor-pointer">
                <summary className="flex items-center justify-between list-none">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                    )} />
                    <span className="font-medium text-gray-800">{formatDate(report.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-sm font-semibold',
                      pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
                    )}>
                      {pct}%
                    </span>
                    <span className="text-gray-400 text-sm">▼</span>
                  </div>
                </summary>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(SLIDER_LABELS) as string[]).map(key => {
                    const val = (report.sliders as unknown as Record<string, number>)[key]
                    if (val === undefined || val === null) return null
                    return (
                      <div key={key} className="text-center">
                        <div className={cn('text-xl font-bold', getSliderColor(val))}>
                          {val}
                        </div>
                        <div className="text-xs text-gray-400">{SLIDER_LABELS[key]}</div>
                      </div>
                    )
                  })}
                </div>

                {report.symptoms.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Simptome:</p>
                    <div className="flex flex-wrap gap-2">
                      {report.symptoms.map((s, i) => (
                        <span key={i} className="badge bg-red-50 text-red-700">
                          {s.name} ({s.severity}/10)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
