import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { user_id?: string; name?: string; url?: string }
  const { user_id, name, url } = body

  if (!user_id) return NextResponse.json({ error: 'user_id lipsă' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'Nume lipsă' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL lipsă' }, { status: 400 })

  try { new URL(url) } catch {
    return NextResponse.json({ error: 'URL invalid' }, { status: 400 })
  }

  const { data: doc, error } = await service()
    .from('documents')
    .insert({
      user_id,
      name: name.trim(),
      file_path: url.trim(),
      size_bytes: null,
      uploaded_by: user.id,
      is_global: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  waitUntil((async () => {
    try {
      const { sendPushToUser } = await import('@/lib/push')
      await sendPushToUser(user_id, { title: 'Document nou pentru tine', body: name.trim(), url: '/documente' })
    } catch (e) { console.error('[PUSH] link:', e) }
  })())

  return NextResponse.json(doc, { status: 201 })
}
