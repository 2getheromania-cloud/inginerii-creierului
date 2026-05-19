import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendManualNotification } from '@/lib/email/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userIds, subject, message, scheduleFor } = body

  if (!userIds?.length || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
  }

  const service = createServiceClient()

  // Dacă e programată, inserăm în tabel
  if (scheduleFor) {
    const { error } = await service
      .from('scheduled_notifications')
      .insert({ user_ids: userIds, subject, message, scheduled_for: scheduleFor, created_by: user.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, scheduled: true })
  }

  // Trimitere imediată
  const { data: profiles } = await service
    .from('profiles')
    .select('id, email, name')
    .in('id', userIds)

  const errors: string[] = []
  for (const p of profiles ?? []) {
    try {
      await sendManualNotification(p.email, subject, message)
      await service.from('notifications').insert({
        user_id: p.id,
        type: 'manual',
        channel: 'email',
        message: `[${subject}] ${message}`,
      })
    } catch (e) {
      errors.push(p.email)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: `Eroare pentru: ${errors.join(', ')}` }, { status: 207 })
  }

  return NextResponse.json({ ok: true })
}
