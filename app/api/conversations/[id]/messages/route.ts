import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conv } = await service().from('conversations').select('user_id').eq('id', params.id).single()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  if (conv.user_id !== user.id && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await service()
    .from('private_messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json() as { content: string }
  if (!content?.trim()) return NextResponse.json({ error: 'Mesaj gol' }, { status: 400 })

  const { data: conv } = await service().from('conversations').select('user_id').eq('id', params.id).single()
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: senderProfile } = await service().from('profiles').select('role, name, email').eq('id', user.id).single()
  const isAdmin = senderProfile?.role === 'admin'
  if (conv.user_id !== user.id && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: msg, error } = await service()
    .from('private_messages')
    .insert({ conversation_id: params.id, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const { sendPrivateChatNotification } = await import('@/lib/email/resend')
    if (isAdmin) {
      const { data: cursantProfile } = await service().from('profiles').select('email, name').eq('id', conv.user_id).single()
      if (cursantProfile) await sendPrivateChatNotification(cursantProfile.email, cursantProfile.name, senderProfile?.name ?? 'Admin', content.trim(), false)
    } else {
      const { data: admins } = await service().from('profiles').select('email, name').eq('role', 'admin')
      for (const admin of admins ?? []) {
        await sendPrivateChatNotification(admin.email, admin.name, senderProfile?.name ?? senderProfile?.email ?? 'Cursant', content.trim(), true)
      }
    }
  } catch {}

  return NextResponse.json(msg)
}
