import { createClient } from '@/lib/supabase/server'
import { purgeUser } from '@/lib/admin/purgeUser'
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

  const { error } = await purgeUser(userId)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
