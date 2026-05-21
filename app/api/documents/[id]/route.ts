import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getDocAndCheck(docId: string, userId: string, isAdmin: boolean) {
  const { data: doc } = await service().from('documents').select('*').eq('id', docId).single()
  if (!doc) return null
  if (!isAdmin && doc.user_id !== userId) return null
  return doc
}

// Returns a short-lived signed URL for download
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const doc = await getDocAndCheck(params.id, user.id, isAdmin)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await service()
    .storage
    .from('documents')
    .createSignedUrl(doc.file_path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Nu s-a putut genera link-ul.' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const doc = await getDocAndCheck(params.id, user.id, isAdmin)
  if (!doc) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })

  await service().storage.from('documents').remove([doc.file_path])
  const { error } = await service().from('documents').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
