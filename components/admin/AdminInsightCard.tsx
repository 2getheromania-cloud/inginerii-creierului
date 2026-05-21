import type { DailyReport } from '@/lib/types'
import { SLIDER_LABELS } from '@/lib/program'

interface Signal {
  level: 'ok' | 'warn' | 'alert'
  text: string
}

function avg(reports: DailyReport[], key: string): number | null {
  const vals = reports.map(r => (r.sliders as unknown as Record<string, number>)[key]).filter(v => v != null)
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

function buildSignals(reports7: DailyReport[], reports30: DailyReport[]): Signal[] {
  const signals: Signal[] = []

  // Aderență ultimele 7 zile
  const adherence = reports7.length
  if (adherence >= 6) {
    signals.push({ level: 'ok', text: `Aderență excelentă — ${adherence}/7 zile raportate` })
  } else if (adherence >= 4) {
    signals.push({ level: 'warn', text: `Aderență medie — ${adherence}/7 zile raportate` })
  } else {
    signals.push({ level: 'alert', text: `Aderență scăzută — ${adherence}/7 zile raportate` })
  }

  // Trend față de săptămâna anterioară (ziua 8–14 din reports30)
  const prev7 = reports30.filter(r => {
    const dayDiff = Math.floor((Date.now() - new Date(r.date).getTime()) / 86400000)
    return dayDiff >= 7 && dayDiff <= 14
  })
  if (prev7.length > 0) {
    const diff = reports7.length - prev7.length
    if (diff < -1) signals.push({ level: 'warn', text: `Scădere completare față de săptămâna anterioară (${prev7.length} → ${reports7.length} zile)` })
    else if (diff > 0) signals.push({ level: 'ok', text: `Progres față de săptămâna anterioară (+${diff} zile)` })
  }

  // Somn redus + stres crescut
  const avgSomn  = avg(reports7, 'somn')
  const avgStres = avg(reports7, 'stres')
  if (avgSomn != null && avgStres != null && avgSomn < 5 && avgStres > 6) {
    signals.push({
      level: 'alert',
      text: `Somn redus (${avgSomn.toFixed(1)}/10) + stres crescut (${avgStres.toFixed(1)}/10) — posibil burnout`,
    })
  }

  // Energie scăzută
  const avgEnergie = avg(reports7, 'energie')
  if (avgEnergie != null && avgEnergie < 4) {
    signals.push({ level: 'warn', text: `Energie sub medie (${avgEnergie.toFixed(1)}/10) — verifică suplimentele` })
  }

  // Digestie problematică
  const avgDigestie = avg(reports7, 'digestie')
  if (avgDigestie != null && avgDigestie < 4) {
    signals.push({ level: 'warn', text: `Digestie dificilă (${avgDigestie.toFixed(1)}/10) — poate necesita ajustare protocol` })
  }

  // Inactivitate recentă
  if (reports30.length > 0) {
    const lastDate = new Date(reports30[0].date)
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
    if (daysSince >= 5) {
      signals.push({ level: 'alert', text: `Inactiv ${daysSince} zile — follow-up recomandat` })
    } else if (daysSince >= 3) {
      signals.push({ level: 'warn', text: `Inactiv ${daysSince} zile — poate are nevoie de suport` })
    }
  } else {
    signals.push({ level: 'alert', text: 'Niciun raport în ultimele 30 de zile' })
  }

  // Note recente
  const notedReports = reports7.filter(r => r.note && r.note.trim())
  if (notedReports.length > 0) {
    signals.push({ level: 'ok', text: `${notedReports.length} ${notedReports.length === 1 ? 'notă personală' : 'note personale'} în această săptămână` })
  }

  return signals
}

const SIGNAL_STYLES: Record<Signal['level'], string> = {
  ok:    'bg-green-50 border-green-200 text-green-800',
  warn:  'bg-yellow-50 border-yellow-200 text-yellow-800',
  alert: 'bg-red-50 border-red-200 text-red-700',
}

const SIGNAL_ICONS: Record<Signal['level'], string> = {
  ok:    '✓',
  warn:  '⚠',
  alert: '!',
}

const SLIDER_KEYS_DISPLAY = ['energie', 'somn', 'stres', 'stare_generala', 'productivitate', 'digestie', 'claritate', 'dispozitie']

export default function AdminInsightCard({
  reports7,
  reports30,
}: {
  reports7: DailyReport[]
  reports30: DailyReport[]
}) {
  const signals = buildSignals(reports7, reports30)

  const sliderAvgs = SLIDER_KEYS_DISPLAY.map(key => ({
    key,
    label: SLIDER_LABELS[key] ?? key,
    value: avg(reports7, key),
  })).filter(s => s.value != null)

  if (reports7.length === 0 && reports30.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-2">Sinteză inteligentă</h3>
        <p className="text-sm text-gray-400">Niciun raport disponibil pentru analiză.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧠</span>
        <h3 className="font-semibold text-gray-900">Sinteză inteligentă</h3>
        <span className="text-xs text-gray-400 ml-auto">Ultimele 7 zile</span>
      </div>

      {/* Signals */}
      <div className="space-y-2 mb-5">
        {signals.map((s, i) => (
          <div key={i} className={`flex items-start gap-2.5 text-sm px-3 py-2 rounded-xl border ${SIGNAL_STYLES[s.level]}`}>
            <span className="font-bold flex-shrink-0 w-4 text-center">{SIGNAL_ICONS[s.level]}</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>

      {/* Slider averages grid */}
      {sliderAvgs.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medii indicatori</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sliderAvgs.map(({ key, label, value }) => {
              const v = value!
              const color = v >= 7 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-500'
              return (
                <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{v.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Recent notes */}
      {reports7.filter(r => r.note?.trim()).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Note recente</p>
          <div className="space-y-2">
            {reports7.filter(r => r.note?.trim()).map(r => (
              <blockquote key={r.id} className="border-l-2 border-brand-300 pl-3 text-sm text-gray-600 italic">
                <span className="text-xs text-gray-400 not-italic">{r.date} — </span>
                "{r.note}"
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
