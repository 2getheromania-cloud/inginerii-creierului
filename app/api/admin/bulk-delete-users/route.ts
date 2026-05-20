import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userIds } = await request.json() as { userIds?: string[] }
  if (!Array.isArray(userIds) || userIds.length === 0)
    return NextResponse.json({ error: 'userIds lipsă sau gol.' }, { status: 400 })

  // Prevent self-deletion
  const safeIds = userIds.filter(id => id !== user.id)
  if (safeIds.length === 0)
    return NextResponse.json({ error: 'Nu poți șterge propriul cont.' }, { status: 400 })

  const service = createServiceClient()
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let deleted = 0
  const errors: string[] = []

  for (const userId of safeIds) {
    await service.from('daily_reports').delete().eq('user_id', userId)
    await service.from('profiles').delete().eq('id', userId)
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) errors.push(`${userId}: ${error.message}`)
    else deleted++
  }

  if (errors.length > 0 && deleted === 0)
    return NextResponse.json({ error: `Ștergere eșuată: ${errors[0]}` }, { status: 500 })

  return NextResponse.json({ ok: true, deleted, errors })
}
