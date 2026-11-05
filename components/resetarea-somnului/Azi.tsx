'use client'
// Cardul „Azi" de pe pagina programului: ce e nou azi și bifele zilei.
import { useState } from 'react'
import type { DateJurnal } from '@/lib/resetarea-somnului/plan'
import ZiuaJurnal from './ZiuaJurnal'

export default function Azi({
  resourceId,
  zi,
  dateInitiale,
}: {
  resourceId: string
  zi: number
  dateInitiale: DateJurnal
}) {
  const [date, setDate] = useState<DateJurnal>(dateInitiale)
  return <ZiuaJurnal resourceId={resourceId} zi={zi} date={date} onChange={setDate} />
}
