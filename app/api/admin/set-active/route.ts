import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, active } = await request.json() as { userId?: string; active?: boolean }
  if (!userId) return NextResponse.json({ error: 'userId lipsă.' }, { status: 400 })
  if (typeof active !== 'boolean') return NextResponse.json({ error: 'active lipsă.' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Nu îți poți dezactiva propriul cont.' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('profiles').update({ active }).eq('id', userId)
  if (error) {
    const hint = error.code === '42703'
      ? ' Rulează migrația supabase/migrations/20260830_active_and_delete_fix.sql.'
      : ''
    return NextResponse.json({ error: error.message + hint }, { status: 500 })
  }

  return NextResponse.json({ ok: true, active })
}
