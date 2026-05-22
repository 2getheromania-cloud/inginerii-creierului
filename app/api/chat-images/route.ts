import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Eroare la citirea fișierului.' }, { status: 400 })
  }

  const file = form.get('file') as File | null
  if (!file || file.size === 0) return NextResponse.json({ error: 'Niciun fișier selectat.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Imaginea depășește 5 MB.' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Tip nepermis. Folosiți JPG, PNG, GIF sau WebP.' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const sb = service()

  // Create bucket if it doesn't exist yet (no-op if already exists)
  await sb.storage.createBucket('chat-images', { public: true }).catch(() => {})

  const { error: uploadErr } = await sb.storage
    .from('chat-images')
    .upload(path, bytes, { contentType: file.type })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from('chat-images').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
