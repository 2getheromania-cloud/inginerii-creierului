'use client'

interface Props {
  avgReports: number | null
  maxReports: number | null
  totalUsers: number | null
  userDaysCompleted: number
}

export default function CommunityWinsCard({ avgReports, maxReports, totalUsers, userDaysCompleted }: Props) {
  if (!totalUsers || totalUsers < 2) return null

  const avg = avgReports ?? 0
  const isAboveAvg = userDaysCompleted > avg

  const wins: string[] = []

  if (maxReports !== null && maxReports >= 7) {
    wins.push('Cineva a completat toate 7/7 zilele săptămâna aceasta!')
  }
  if (maxReports !== null && maxReports >= 5) {
    wins.push(`Recordul grupului: ${maxReports}/7 zile consecutive.`)
  }
  if (avg >= 5) {
    wins.push(`Media grupului: ${avg.toFixed(1)}/7 — performanță excelentă colectiv!`)
  } else if (avg >= 3) {
    wins.push(`Media grupului: ${avg.toFixed(1)}/7 zile completate.`)
  }
  if (isAboveAvg && userDaysCompleted > 0) {
    wins.push(`Ești peste media grupului (${avg.toFixed(1)}/7)! Felicitări!`)
  }

  if (wins.length === 0) return null

  return (
    <div className="card bg-gradient-to-br from-green-50 to-white border-green-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏆</span>
        <h3 className="font-semibold text-gray-800">Victoriile comunității</h3>
        {totalUsers && (
          <span className="ml-auto text-xs text-gray-400">{totalUsers} cursanți activi</span>
        )}
      </div>
      <ul className="space-y-2">
        {wins.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
