import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function calcCompletionPct(checks: Record<string, unknown>): number {
  let total = 0
  let done = 0
  const countObj = (obj: Record<string, unknown>) => {
    for (const v of Object.values(obj)) {
      if (typeof v === 'boolean') { total++; if (v) done++ }
      else if (typeof v === 'object' && v !== null) countObj(v as Record<string, unknown>)
    }
  }
  countObj(checks)
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

export function getSliderColor(value: number): string {
  if (value <= 3) return 'text-red-500'
  if (value <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

export function calcStreak(reports: { date: string }[]): number {
  if (!reports.length) return 0
  const today = todayISO()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = yesterday.toISOString().split('T')[0]

  const dateSet = new Set(reports.map(r => r.date))

  const startDate = dateSet.has(today) ? today : dateSet.has(yesterdayISO) ? yesterdayISO : null
  if (!startDate) return 0

  let streak = 0
  const cursor = new Date(startDate)
  while (true) {
    const iso = cursor.toISOString().split('T')[0]
    if (!dateSet.has(iso)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v'))
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    if (u.hostname === 'youtu.be')
      return `https://www.youtube.com/embed${u.pathname}`
    if (u.hostname.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/)
      if (m) return `https://player.vimeo.com/video/${m[1]}`
    }
    if (u.hostname.includes('loom.com') && u.pathname.startsWith('/share/'))
      return `https://www.loom.com/embed/${u.pathname.replace('/share/', '')}`
  } catch {}
  return null
}
