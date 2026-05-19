'use client'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import type { DailyReport } from '@/lib/types'
import { SLIDER_LABELS } from '@/lib/program'
import { formatDateShort } from '@/lib/utils'

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
)

interface Props {
  reports: DailyReport[]
  type?: 'line' | 'bar'
  days?: number
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function ProgressChart({ reports, type = 'line', days = 30 }: Props) {
  const sorted = [...reports]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days)

  const labels = sorted.map(r => formatDateShort(r.date))
  const sliderKeys = Object.keys(SLIDER_LABELS) as (keyof typeof SLIDER_LABELS)[]

  if (type === 'bar') {
    // Completion % per day
    const data = sorted.map(r => {
      const checks = r.checks as Record<string, unknown>
      let total = 0, done = 0
      const countObj = (obj: Record<string, unknown>) => {
        for (const v of Object.values(obj)) {
          if (typeof v === 'boolean') { total++; if (v) done++ }
          else if (typeof v === 'object' && v !== null) countObj(v as Record<string, unknown>)
        }
      }
      countObj(checks)
      return total === 0 ? 0 : Math.round((done / total) * 100)
    })

    return (
      <Bar
        data={{
          labels,
          datasets: [{
            label: 'Completare checklist (%)',
            data,
            backgroundColor: data.map(v => v >= 80 ? '#22c55e99' : v >= 50 ? '#f59e0b99' : '#ef444499'),
            borderRadius: 6,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, ticks: { callback: v => `${v}%` }, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } },
          },
        }}
      />
    )
  }

  const datasets = sliderKeys.map((key, idx) => ({
    label: SLIDER_LABELS[key],
    data: sorted.map(r => r.sliders[key as keyof typeof r.sliders] ?? null),
    borderColor: COLORS[idx % COLORS.length],
    backgroundColor: `${COLORS[idx % COLORS.length]}22`,
    fill: false,
    tension: 0.4,
    pointRadius: 4,
    pointHoverRadius: 6,
  }))

  return (
    <Line
      data={{ labels, datasets }}
      options={{
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        },
        scales: {
          y: { min: 1, max: 10, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } },
        },
      }}
    />
  )
}
