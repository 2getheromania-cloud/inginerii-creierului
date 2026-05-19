import { createServiceClient } from '@/lib/supabase/server'
import { sendInactivityAlert } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const adminEmail = process.env.ADMIN_EMAIL!

  const { data: stats } = await service
    .from('admin_stats')
    .select('id, name, email, days_since_report')
    .gte('days_since_report', 3)

  if (!stats?.length) return NextResponse.json({ ok: true, alerts: 0 })

  let alerts = 0
  for (const c of stats) {
    try {
      await sendInactivityAlert(adminEmail, c.name, c.email, c.days_since_report)
      await service.from('notifications').insert({
        user_id: c.id,
        type: 'inactivity_alert',
        channel: 'email',
        message: `Alertă admin: ${c.name || c.email} nu a raportat în ${c.days_since_report} zile.`,
      })
      alerts++
    } catch {}
  }

  return NextResponse.json({ ok: true, alerts })
}
