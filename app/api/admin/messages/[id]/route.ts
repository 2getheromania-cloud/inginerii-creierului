import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? true : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const service = createServiceClient()

  const update: Record<string, unknown> = {}
  if ('title'       in body) update.title        = body.title
  if ('body'        in body) update.body         = body.body
  if ('video_url'   in body) update.video_url    = body.video_url || null
  if ('target_type' in body) update.target_type  = body.target_type
  if ('target_value'in body) update.target_value = body.target_value || null
  if ('is_active'   in body) update.is_active    = body.is_active
  if ('published_at'in body) update.published_at = body.published_at

  const { error } = await service.from('admin_messages').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const service = createServiceClient()
  const { error } = await service.from('admin_messages').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
