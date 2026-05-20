import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const service = createServiceClient()

  const update: Record<string, unknown> = {}
  if ('is_pinned'       in body) update.is_pinned       = body.is_pinned
  if ('is_announcement' in body) update.is_announcement = body.is_announcement
  if ('message_type'    in body) update.message_type    = body.message_type
  if (body.deleted === true)     update.deleted_at      = new Date().toISOString()

  const { error } = await service
    .from('group_chat_messages')
    .update(update)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
