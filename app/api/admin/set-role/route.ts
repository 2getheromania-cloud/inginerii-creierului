import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { email?: string; userId?: string; role?: string }
  const { email, userId, role } = body

  if (!role || !['admin', 'cursant'].includes(role)) {
    return NextResponse.json({ error: 'Rol invalid.' }, { status: 400 })
  }

  const service = createServiceClient()
  let targetId: string

  if (userId) {
    targetId = userId
  } else if (email) {
    const { data: target } = await service
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()
    if (!target) return NextResponse.json({ error: 'Utilizator negăsit cu emailul respectiv.' }, { status: 404 })
    targetId = target.id
  } else {
    return NextResponse.json({ error: 'userId sau email lipsă.' }, { status: 400 })
  }

  if (targetId === user.id) {
    return NextResponse.json({ error: 'Nu poți modifica propriul rol.' }, { status: 400 })
  }

  const { error } = await service.from('profiles').update({ role }).eq('id', targetId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
