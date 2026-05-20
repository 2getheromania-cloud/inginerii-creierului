interface Props {
  daysCompleted: number
  avgGroup: number | null
}

function getMessage(days: number, avg: number | null): string {
  if (days === 7)
    return 'Performanță excepțională! Ai completat toate cele 7 zile ale săptămânii. Ești un exemplu de consecvență!'
  if (days >= 5)
    return `Ești printre cei mai consecvenți cursanți! Ai completat ${days} din ultimele 7 zile. Continuă tot așa!`
  if (avg !== null && days > avg)
    return `Ai depășit media grupului săptămâna aceasta (medie: ${Math.round(avg)}/7). Continuă ritmul!`
  if (days >= 3)
    return `Ești pe drumul bun! Ai completat ${days} din ultimele 7 zile. Încearcă să mai adaugi o zi — fiecare pas contează.`
  if (days >= 1)
    return `Ai făcut ${days === 1 ? 'primul pas' : 'primii pași'}! Fiecare zi completată îți schimbă microbiomul. Mergi mai departe!`
  return 'Fiecare zi este o oportunitate nouă. Completează checklistul azi și vei simți diferența!'
}

export default function MotivationalCard({ daysCompleted, avgGroup }: Props) {
  const color =
    daysCompleted >= 5 ? 'bg-brand-500'
    : daysCompleted >= 3 ? 'bg-amber-400'
    : 'bg-gray-200'

  return (
    <div className="card bg-gradient-to-br from-brand-50/60 to-white border-brand-100">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">🌱</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 mb-1">
            <h3 className="font-semibold text-gray-800">Progresul tău — ultimele 7 zile</h3>
            <span className={`text-xl font-bold ${daysCompleted >= 5 ? 'text-brand-600' : daysCompleted >= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
              {daysCompleted}/7
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{getMessage(daysCompleted, avgGroup)}</p>
          {avgGroup !== null && (
            <p className="text-xs text-gray-400 mt-1.5">
              Media grupului: {Math.round(avgGroup * 10) / 10}/7 zile completate.
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${i < daysCompleted ? color : 'bg-gray-100'}`}
          />
        ))}
      </div>
    </div>
  )
}
