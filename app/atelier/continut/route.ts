// /atelier/continut — HTML-ul atelierului, doar pentru conturile cu acces.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { areAccesLaAtelier } from '@/lib/atelier/acces'
import ATELIER_HTML from '@/lib/atelier/continut'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !areAccesLaAtelier(user.email)) {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/', req.url))
  }
  return new NextResponse(ATELIER_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
