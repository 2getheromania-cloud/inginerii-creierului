import { createServiceClient } from '@/lib/supabase/server'
import { sendDailyReminder } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const currentHour = String(now.getUTCHours()).padStart(2, '0')
  const today = now.toISOString().split('T')[0]

  const { data: cursanti } = await service
    .from('profiles')
    .select('id, name, email, reminder_time')
    .eq('role', 'cursant')

  if (!cursanti?.length) return NextResponse.json({ ok: true, sent: 0 })

  const { data: todayReports } = await service
    .from('daily_reports')
    .select('user_id')
    .eq('date', today)

  const reportedIds = new Set((todayReports ?? []).map(r => r.user_id))

  const toRemind = cursanti.filter(c => {
    if (reportedIds.has(c.id)) return false
    const rt = c.reminder_time ?? '18:00'
    const [h] = rt.split(':')
    return h.padStart(2, '0') === currentHour
  })

  let sent = 0
  for (const c of toRemind) {
    try {
      await sendDailyReminder(c.email, c.name)
      await service.from('notifications').insert({
        user_id: c.id,
        type: 'daily_reminder',
        channel: 'email',
        message: 'Reminder zilnic: completează raportul de azi.',
      })
      sent++
    } catch {}
  }

  return NextResponse.json({ ok: true, sent })
}
