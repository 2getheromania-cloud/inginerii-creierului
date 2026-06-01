import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userIds, title, body } = await request.json()
  if (!userIds?.length || !title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
  }

  const service = createServiceClient()
  let sent = 0
  const errors: string[] = []

  for (const uid of userIds) {
    try {
      await sendPushToUser(uid, { title, body, url: '/' })
      await service.from('notifications').insert({
        user_id: uid,
        type: 'manual',
        channel: 'push',
        message: `[PUSH] ${title}: ${body}`,
      })
      sent++
    } catch (e) {
      errors.push(uid)
    }
  }

  return NextResponse.json({ ok: true, sent, failed: errors.length })
}
