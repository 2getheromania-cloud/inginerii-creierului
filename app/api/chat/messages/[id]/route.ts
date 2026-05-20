import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const service = serviceClient()

  const update: Record<string, unknown> = {}
  if ('is_pinned'       in body) update.is_pinned       = body.is_pinned
  if ('is_announcement' in body) update.is_announcement = body.is_announcement
  if ('message_type'    in body) update.message_type    = body.message_type

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Niciun câmp de actualizat' }, { status: 400 })

  const { error } = await service
    .from('group_chat_messages')
    .update(update)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const service = serviceClient()

  const { data, error } = await service
    .from('group_chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0)
    return NextResponse.json({ error: 'Mesajul nu a fost găsit sau e deja șters' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
