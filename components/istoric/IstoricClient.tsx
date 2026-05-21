'use client'
import { useState } from 'react'
import ProgressChart from '@/components/charts/ProgressChart'
import { formatDate, calcCompletionPct, getSliderColor } from '@/lib/utils'
import { SLIDER_LABELS } from '@/lib/program'
import { cn } from '@/lib/utils'
import type { DailyReport } from '@/lib/types'

export default function IstoricClient({ reports }: { reports: DailyReport[] }) {
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const [activeTab, setActiveTab] = useState<'grafice' | 'lista'>('grafice')

  const filtered = reports.slice(0, period)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['grafice', 'lista'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab === 'grafice' ? 'Grafice' : 'Listă'}
          </button>
        ))}
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
      </div>

      {activeTab === 'grafice' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Zile raportate', value: filtered.length },
              { label: 'Medie completare', value: `${Math.round(filtered.reduce((s, r) => s + calcCompletionPct(r.checks as unknown as Record<string, unknown>), 0) / (filtered.length || 1))}%` },
              { label: 'Medie energie', value: (filtered.reduce((s, r) => s + (r.sliders.energie || 0), 0) / (filtered.length || 1)).toFixed(1) },
              { label: 'Medie somn', value: (filtered.reduce((s, r) => s + (r.sliders.somn || 0), 0) / (filtered.length || 1)).toFixed(1) },
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
            <h3 className="font-semibold text-gray-800 mb-4">Calendar activitate (30 zile)</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (29 - i))
                const iso = d.toISOString().split('T')[0]
                const hasReport = reports.some(r => r.date === iso)
                return (
                  <div
                    key={iso}
                    title={iso}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      hasReport ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Comparație săptămâni</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['energie','somn','stres','stare_generala','productivitate'] as const).map(key => {
                const label = SLIDER_LABELS[key]
                const thisWeek = reports.slice(0,7)
                const prevWeek = reports.slice(7,14)
                const avg = (arr: typeof reports) => arr.length ? arr.reduce((s,r) => s + (r.sliders[key]||0), 0) / arr.length : 0
                const curr = avg(thisWeek)
                const prev = avg(prevWeek)
                const diff = curr - prev
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

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(Object.keys(SLIDER_LABELS) as (keyof typeof SLIDER_LABELS)[]).map(key => (
                    <div key={key} className="text-center">
                      <div className={cn('text-xl font-bold', getSliderColor(report.sliders[key as keyof typeof report.sliders] ?? 5))}>
                        {report.sliders[key as keyof typeof report.sliders] ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400">{SLIDER_LABELS[key]}</div>
                    </div>
                  ))}
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
