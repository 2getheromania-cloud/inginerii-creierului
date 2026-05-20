import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? supabase : null
}

export async function GET() {
  const client = await requireAdmin()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await client.from('admin_messages').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const client = await requireAdmin()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, body: msgBody, video_url, target_type, target_value, is_active, published_at } = body

  if (!title?.trim() || !msgBody?.trim())
    return NextResponse.json({ error: 'Titlu și text obligatorii.' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service.from('admin_messages').insert({
    title: title.trim(),
    body: msgBody.trim(),
    video_url: video_url?.trim() || null,
    target_type: target_type ?? 'all',
    target_value: target_value?.trim() || null,
    is_active:    is_active ?? true,
    published_at: published_at ?? new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
