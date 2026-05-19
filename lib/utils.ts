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
