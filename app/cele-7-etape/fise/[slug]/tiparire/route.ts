// Fișa ca document de sine stătător, pentru tipărit.
//
// E o rută, nu o pagină, tocmai ca să nu moștenească niciun cadru al aplicației:
// ce iese de aici e exact foaia, cu antetul ei, în identitatea IC. Aceeași
// verificare de acces ca la pagina de citire — `resources` cu RLS, care cere
// deodată înscriere activă, modul deschis și treapta plătită.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFisa } from '@/lib/fise'
import { stilFise } from '@/lib/fise/stil'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const fisa = getFisa(params.slug)
  if (!fisa) return new NextResponse('Not found', { status: 404 })

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Not found', { status: 404 })

  const { data: resursa } = await supabase
    .from('resources')
    .select('id')
    .eq('slug', params.slug)
    // limit(1): slug-ul e unic pe program, iar programe sunt mai multe în
    // aceeași bază. Fără el, o a doua ediție cu aceeași fișă ar face
    // maybeSingle să arunce, nu să aleagă.
    .limit(1)
    .maybeSingle()

  if (!resursa) return new NextResponse('Not found', { status: 404 })

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(fisa.titlu)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap">
<style>${stilFise}</style>
</head>
<body>
<div class="sheet">
${fisa.corp}
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Fișa e a unui singur om și depinde de ce a plătit. Nu se pune în
      // niciun cache intermediar.
      'Cache-Control': 'private, no-store',
    },
  })
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, c =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'
  )
}
