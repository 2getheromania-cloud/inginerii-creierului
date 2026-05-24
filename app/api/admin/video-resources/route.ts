import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

function service() {
  return supa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const { data: prof } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  return (prof as { role: string } | null)?.role === 'admin' ? user : null
}

export async function GET() {
  const db = service()
  const { data } = await db
    .from('video_resources')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await service()
    .from('video_resources')
    .insert({
      title: body.title,
      description: body.description || null,
      video_url: body.video_url,
      category: body.category,
      target_type: body.target_type ?? 'all',
      target_value: body.target_value || null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  waitUntil((async () => {
    try {
      const { sendPushToUser } = await import('@/lib/push')
      const { data: cursants } = await service().from('profiles').select('id').neq('role', 'admin')
      for (const c of cursants ?? []) {
        await sendPushToUser(c.id, { title: 'Bibliotecă', body: `Video nou: ${body.title}`, url: '/biblioteca' })
      }
    } catch (e) { console.error('[PUSH] video:', e) }
  })())

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await service()
    .from('video_resources')
    .update({
      title: rest.title,
      description: rest.description || null,
      video_url: rest.video_url,
      category: rest.category,
      target_type: rest.target_type,
      target_value: rest.target_value || null,
      is_active: rest.is_active,
      sort_order: rest.sort_order ?? 0,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await service().from('video_resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
