'use client'
import type { DailySliders } from '@/lib/types'

interface WeekReport {
  date: string
  sliders?: Partial<DailySliders> | null
}

interface Props {
  reports: WeekReport[]
  streak: number
}

function avg(reports: WeekReport[], key: keyof DailySliders): number | null {
  const vals = reports
    .map(r => (r.sliders as Partial<DailySliders> | null)?.[key])
    .filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

function motivationalText(days: number, streak: number): string {
  if (days === 7) return 'Săptămână perfectă! Ești în top cursanți!'
  if (days >= 5) return 'Săptămână excelentă! Continuă să fii consistent!'
  if (days >= 3) return 'Bun start! Încearcă să completezi mai multe zile săptămâna viitoare.'
  if (days >= 1) return 'Ai făcut primii pași! Fiecare zi contează.'
  return streak > 0 ? 'Nu uita să completezi raportul de azi pentru a-ți menține streak-ul!' : 'Începe acum — primul pas e cel mai important!'
}

export default function WeeklySummaryCard({ reports, streak }: Props) {
  const days = reports.length
  const pct = Math.round((days / 7) * 100)

  const avgEnergie    = avg(reports, 'energie')
  const avgSomn       = avg(reports, 'somn')
  const avgStres      = avg(reports, 'stres')
  const avgDisgestie  = avg(reports, 'digestie')

  const sliderStats = [
    { label: 'Energie',  val: avgEnergie },
    { label: 'Somn',     val: avgSomn },
    { label: 'Stres',    val: avgStres },
    { label: 'Digestie', val: avgDisgestie },
  ].filter(s => s.val !== null)

  return (
    <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Rezumat săptămânal</h3>
        <span className="text-xs text-gray-400">ultimele 7 zile</span>
      </div>

      {/* Days progress */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{days}/7 zile completate</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-brand-500 h-2.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5 flex-shrink-0">
            <span>🔥</span>
            <span className="text-sm font-bold text-orange-700">{streak}z</span>
          </div>
        )}
      </div>

      {/* Day dots */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full ${i < days ? 'bg-brand-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Slider averages */}
      {sliderStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {sliderStats.map(({ label, val }) => (
            <div key={label} className="bg-white rounded-xl px-3 py-2 border border-gray-100">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-lg font-bold text-gray-800">{val!.toFixed(1)}<span className="text-xs text-gray-400">/10</span></div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-brand-700 font-medium leading-snug">
        {motivationalText(days, streak)}
      </p>
    </div>
  )
}
