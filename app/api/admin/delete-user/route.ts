import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userId } = body as { userId?: string }
  if (!userId) return NextResponse.json({ error: 'userId lipsă' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Nu poți șterge propriul cont.' }, { status: 400 })

  const service = createServiceClient()

  await service.from('daily_reports').delete().eq('user_id', userId)
  await service.from('profiles').delete().eq('id', userId)

  // auth.admin requires the vanilla supabase-js client with service role, not @supabase/ssr
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error: authErr } = await adminClient.auth.admin.deleteUser(userId)
  if (authErr) return NextResponse.json({ error: `Auth delete: ${authErr.message}` }, { status: 500 })

  return NextResponse.json({ ok: true })
}
