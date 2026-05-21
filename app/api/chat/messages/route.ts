import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SELECT = '*, sender:profiles!sender_id(id, name, email, role), reactions:group_chat_reactions(emoji, user_id)'

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const since  = searchParams.get('since')
  const before = searchParams.get('before')

  // Service client bypasses profiles RLS so the sender JOIN works for all users
  const service = serviceClient()
  let q = service
    .from('group_chat_messages')
    .select(SELECT)
    .is('deleted_at', null)

  if (since) {
    // Polling: messages strictly after 'since' timestamp, ascending
    const { data, error } = await q
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  if (before) {
    // Load older: 60 messages before timestamp, then reverse for display
    const { data, error } = await q
      .lt('created_at', before)
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json((data ?? []).reverse())
  }

  // Default: last 60 messages, reversed to ascending for display
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).reverse())
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body, image_url, image_path } = await request.json() as {
    body?: string | null
    image_url?: string | null
    image_path?: string | null
  }

  if (!body?.trim() && !image_url)
    return NextResponse.json({ error: 'Mesajul nu poate fi gol.' }, { status: 400 })

  const { data, error } = await supabase
    .from('group_chat_messages')
    .insert({
      sender_id:  user.id,
      body:       body?.trim() || null,
      image_url:  image_url  || null,
      image_path: image_path || null,
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
