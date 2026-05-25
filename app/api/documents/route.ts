import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const MAX_BYTES = 10 * 1024 * 1024

export async function GET(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const targetId = req.nextUrl.searchParams.get('user_id') ?? user.id

  if (targetId !== user.id && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Cursanții văd propriile documente + cele globale; adminii văd doar user_id targetat
  const sb = service().from('documents').select('*')
  const query = !isAdmin
    ? sb.or(`user_id.eq.${targetId},is_global.eq.true`)
    : sb.eq('user_id', targetId)
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// Accepts multipart/form-data: file + user_id
// Uses service role for storage — no RLS issues
export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Eroare la citirea form-data.' }, { status: 400 })
  }

  const file = form.get('file') as File | null
  const targetId = (form.get('user_id') as string | null) ?? user.id
  const isGlobalReq = form.get('is_global') === 'true'

  if (!file || file.size === 0) return NextResponse.json({ error: 'Niciun fișier selectat.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Fișierul depășește 10 MB.' }, { status: 400 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  if (targetId !== user.id && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const isGlobal = isAdmin && isGlobalReq

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${targetId}/${Date.now()}_${safeName}`
  const bytes = await file.arrayBuffer()

  const { error: storageErr } = await service()
    .storage
    .from('documents')
    .upload(filePath, bytes, { contentType: file.type || 'application/octet-stream' })

  if (storageErr) {
    return NextResponse.json({ error: `Storage: ${storageErr.message}` }, { status: 500 })
  }

  const { data: doc, error: dbErr } = await service()
    .from('documents')
    .insert({
      user_id: targetId,
      name: file.name,
      file_path: filePath,
      size_bytes: file.size,
      uploaded_by: user.id,
      is_global: isGlobal,
    })
    .select()
    .single()

  if (dbErr) {
    // Clean up orphaned storage object
    await service().storage.from('documents').remove([filePath])
    return NextResponse.json({ error: `Baza de date: ${dbErr.message}` }, { status: 500 })
  }

  waitUntil((async () => {
    try {
      const { sendPushToUser } = await import('@/lib/push')
      if (isGlobal) {
        const { data: cursants } = await service().from('profiles').select('id').neq('role', 'admin')
        for (const c of cursants ?? []) {
          await sendPushToUser(c.id, { title: 'Bibliotecă', body: `Document nou: ${file.name}`, url: '/documente' })
        }
      } else if (targetId !== user.id) {
        await sendPushToUser(targetId, { title: 'Document nou pentru tine', body: file.name, url: '/documente' })
      }
    } catch (e) { console.error('[PUSH] document:', e) }
  })())

  return NextResponse.json(doc, { status: 201 })
}
