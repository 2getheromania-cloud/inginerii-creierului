import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const SELECT = [
  '*',
  'sender:profiles!sender_id(id, name, email, role)',
  'reactions:group_chat_reactions(emoji, user_id)',
  'reply_to:group_chat_messages!reply_to_id(id, body, image_url, sender:profiles!sender_id(name, email))',
].join(', ')

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// PostgREST self-referential joins require a FK constraint on reply_to_id.
// If that FK is missing the join returns null/{}. This manually fills it in.
async function enrichWithReplies(msgs: Record<string, unknown>[], svc: SupabaseClient) {
  const ids = Array.from(new Set(
    msgs
      .filter(m => m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id)
      .map(m => m.reply_to_id as string)
  ))
  if (!ids.length) return msgs

  const { data: originals } = await svc
    .from('group_chat_messages')
    .select('id, body, image_url, sender:profiles!sender_id(name, email)')
    .in('id', ids)

  if (!originals?.length) return msgs

  const byId = new Map(originals.map((r: Record<string, unknown>) => [r.id as string, r]))
  return msgs.map(m =>
    m.reply_to_id && !(m.reply_to as Record<string, unknown> | null)?.id
      ? { ...m, reply_to: byId.get(m.reply_to_id as string) ?? null }
      : m
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
    const { data, error } = await q
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const enriched = await enrichWithReplies((data ?? []) as unknown as Record<string, unknown>[], service)
    return NextResponse.json(enriched)
  }

  if (before) {
    const { data, error } = await q
      .lt('created_at', before)
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const enriched = await enrichWithReplies((data ?? []) as unknown as Record<string, unknown>[], service)
    return NextResponse.json(enriched.reverse())
  }

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const enriched = await enrichWithReplies((data ?? []) as unknown as Record<string, unknown>[], service)
  return NextResponse.json(enriched.reverse())
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body, image_url, image_path, reply_to_id } = await request.json() as {
    body?: string | null
    image_url?: string | null
    image_path?: string | null
    reply_to_id?: string | null
  }

  if (!body?.trim() && !image_url)
    return NextResponse.json({ error: 'Mesajul nu poate fi gol.' }, { status: 400 })

  const service = serviceClient()
  const { data, error } = await service
    .from('group_chat_messages')
    .insert({
      sender_id:   user.id,
      body:        body?.trim() || null,
      image_url:   image_url   || null,
      image_path:  image_path  || null,
      reply_to_id: reply_to_id || null,
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [enriched] = await enrichWithReplies([data as unknown as Record<string, unknown>], service)
  return NextResponse.json(enriched)
}
