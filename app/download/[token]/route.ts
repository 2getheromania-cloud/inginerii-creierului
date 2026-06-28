import { createClient as supa } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
// Ruta generează un signed URL cu expirare scurtă — răspunsul NU trebuie
// cache-uit de Next.js/Vercel, altfel se servește un URL deja expirat.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const BUCKET = 'carti'
const FILE_PATH = 'Noroi_pe_sandalele_sfintilor_ONLINE.pdf'
const DOWNLOAD_NAME = 'Noroi pe sandalele sfintilor.pdf'
const MAX_DOWNLOADS = 5
// Durata signed URL-ului. Mărită la 300s ca să acopere eventuale latențe
// de rețea/redirect fără ca link-ul să expire înainte să fie folosit.
const SIGNED_URL_TTL = 300

// Client admin (service role) — fără cookie-uri, bypass complet RLS.
// Forțăm fetch fără cache ca apelurile către Supabase să nu fie memorate de Next.
function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const admin = service()

    const { data: purchase, error } = await admin
      .from('purchases')
      .select('id, download_count')
      .eq('download_token', params.token)
      .single()

    if (error || !purchase) {
      return NextResponse.json({ error: 'Link invalid' }, { status: 404 })
    }

    if ((purchase.download_count ?? 0) >= MAX_DOWNLOADS) {
      return NextResponse.json(
        { error: 'Limita de descărcări a fost atinsă' },
        { status: 403 }
      )
    }

    // Signed URL din bucket-ul privat, cu nume de descărcare prietenos
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(FILE_PATH, SIGNED_URL_TTL, { download: DOWNLOAD_NAME })

    if (signError || !signed?.signedUrl) {
      console.error('[download] signed url error:', signError?.message)
      return NextResponse.json({ error: 'Eroare la generarea link-ului' }, { status: 500 })
    }

    // Incrementăm contorul de descărcări
    const { error: updateError } = await admin
      .from('purchases')
      .update({ download_count: (purchase.download_count ?? 0) + 1 })
      .eq('id', purchase.id)

    if (updateError) {
      console.error('[download] update error:', updateError.message)
      return NextResponse.json({ error: 'Eroare internă' }, { status: 500 })
    }

    // Redirect cu cache complet dezactivat (browser + CDN Vercel), ca să nu
    // se servească niciodată un signed URL expirat dintr-un răspuns cache-uit.
    const res = NextResponse.redirect(signed.signedUrl)
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    res.headers.set('CDN-Cache-Control', 'no-store')
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('[download] unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 })
  }
}
