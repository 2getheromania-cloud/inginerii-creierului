import { createClient as supa } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BUCKET = 'carti'
const FILE_PATH = 'Noroi_pe_sandalele_sfintilor_ONLINE.pdf'
const DOWNLOAD_NAME = 'Noroi pe sandalele sfintilor.pdf'
const MAX_DOWNLOADS = 5

// Client admin (service role) — fără cookie-uri, bypass complet RLS
function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
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

    // Signed URL de 60s din bucket-ul privat, cu nume de descărcare prietenos
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(FILE_PATH, 60, { download: DOWNLOAD_NAME })

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

    return NextResponse.redirect(signed.signedUrl)
  } catch (err) {
    console.error('[download] unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 })
  }
}
