import { createServiceClient } from '@/lib/supabase/server'
import { sendManualNotification } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date().toISOString()

  const { data: pending } = await service
    .from('scheduled_notifications')
    .select('*')
    .eq('sent', false)
    .lte('scheduled_for', now)

  if (!pending?.length) return NextResponse.json({ ok: true, processed: 0 })

  let processed = 0
  for (const sn of pending) {
    const { data: profiles } = await service
      .from('profiles')
      .select('id, email, name')
      .in('id', sn.user_ids)

    for (const p of profiles ?? []) {
      try {
        await sendManualNotification(p.email, sn.subject, sn.message)
        await service.from('notifications').insert({
          user_id: p.id,
          type: 'manual',
          channel: 'email',
          message: `[${sn.subject}] ${sn.message}`,
        })
      } catch {}
    }

    await service
      .from('scheduled_notifications')
      .update({ sent: true })
      .eq('id', sn.id)

    processed++
  }

  return NextResponse.json({ ok: true, processed })
}
