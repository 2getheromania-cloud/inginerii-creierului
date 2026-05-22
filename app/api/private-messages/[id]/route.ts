import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// PATCH { content } — edit own private message
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json() as { content: string }
  if (!content?.trim()) return NextResponse.json({ error: 'Mesajul nu poate fi gol.' }, { status: 400 })

  const { data: msg } = await service()
    .from('private_messages')
    .select('sender_id')
    .eq('id', params.id)
    .single()

  if (!msg || msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'Poți edita doar mesajele tale.' }, { status: 403 })
  }

  const { data: updated, error } = await service()
    .from('private_messages')
    .update({ content: content.trim(), edited_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated?.length) return NextResponse.json({ error: 'Mesajul nu a fost găsit.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
