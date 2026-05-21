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
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = await service
    .from('admin_stats')
    .select('id, name, email, days_since_report')
    .gte('days_since_report', 3)

  if (!stats?.length) return NextResponse.json({ ok: true, alerts: 0 })

  // Fetch app_start_date for these cursants to avoid alerting on those not yet tracking
  const { data: profiles } = await service
    .from('profiles')
    .select('id, app_start_date')
    .in('id', stats.map(s => s.id))

  const startMap = new Map((profiles ?? []).map(p => [p.id, p.app_start_date as string | null]))

  let alerts = 0
  for (const c of stats) {
    const appStart = startMap.get(c.id) ?? null
    // Skip if monitoring hasn't started or started today (no days to be inactive for)
    if (!appStart || appStart >= today) continue

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
