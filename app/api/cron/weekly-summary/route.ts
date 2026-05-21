import { createServiceClient } from '@/lib/supabase/server'
import { sendWeeklySummary } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: cursanti } = await service
    .from('profiles')
    .select('id, name, email, week')
    .eq('role', 'cursant')

  if (!cursanti?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Ultimele 7 zile
  const from = new Date()
  from.setDate(from.getDate() - 7)
  const fromStr = from.toISOString().split('T')[0]

  let sent = 0
  for (const c of cursanti) {
    const { data: reports } = await service
      .from('daily_reports')
      .select('sliders, date')
      .eq('user_id', c.id)
      .gte('date', fromStr)

    if (!reports?.length) continue

    const avg: Record<string, number> = {}
    const keys = ['energie', 'somn', 'stres', 'stare_generala', 'productivitate', 'digestie', 'claritate', 'dispozitie']
    for (const key of keys) {
      avg[key] = reports.reduce((s, r) => s + (r.sliders[key] ?? 0), 0) / reports.length
    }

    try {
      await sendWeeklySummary(c.email, c.name, c.week, avg, reports.length)
      await service.from('notifications').insert({
        user_id: c.id,
        type: 'weekly_summary',
        channel: 'email',
        message: `Rezumat săptămâna ${c.week}: ${reports.length}/7 zile raportate.`,
      })
      sent++
    } catch {}
  }

  return NextResponse.json({ ok: true, sent })
}
