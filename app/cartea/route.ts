// /cartea — PDF-ul cărții „Corpul nu citește Facebook" pentru cursanții din
// aplicație. Fișierul stă în bucket-ul privat „carti"; ruta verifică sesiunea
// și profilul, apoi trimite la un link semnat, valabil câteva minute, care
// deschide PDF-ul în browser (de acolo se poate și salva).

import { createClient as supa } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BOOKS } from '@/lib/books'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const BUCKET = 'carti'
const SIGNED_URL_TTL = 300
const CARTE = BOOKS['corpul-nu-citeste-facebook']

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

function faraCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  res.headers.set('CDN-Cache-Control', 'no-store')
  res.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  return res
}

export async function GET(req: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return faraCache(NextResponse.redirect(new URL('/', req.url)))

  const admin = service()

  // Doar cursanții programului (cei cu profil activ) și adminii.
  const { data: profil } = await admin
    .from('profiles')
    .select('id, active')
    .eq('id', user.id)
    .maybeSingle()
  if (!profil || profil.active === false) {
    return faraCache(NextResponse.redirect(new URL('/', req.url)))
  }

  const fisier = CARTE.files.pdf
  const { data: semnat, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(fisier.path, SIGNED_URL_TTL)

  if (error || !semnat?.signedUrl) {
    console.error('[cartea] signed url error:', error?.message)
    return faraCache(
      NextResponse.json({ error: 'Cartea nu poate fi deschisă acum. Încercați din nou.' }, { status: 500 })
    )
  }

  return faraCache(NextResponse.redirect(semnat.signedUrl))
}
