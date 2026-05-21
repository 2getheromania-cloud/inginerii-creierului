import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: doc } = await service().from('documents').select('*').eq('id', params.id).single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin && doc.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await service().storage.from('documents').remove([doc.file_path])
  await service().from('documents').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
