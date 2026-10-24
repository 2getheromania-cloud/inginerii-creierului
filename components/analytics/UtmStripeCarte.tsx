'use client'

// Duce etichetele UTM din linkul reclamei mai departe, la plata Stripe.
// Vizitatoarea vine din reclamă pe ...?utm_source=facebook&utm_content=A_ligheanul;
// la butoanele „Cumpără” adăugăm aceleași etichete plus client_reference_id,
// care rămâne salvat la plată în Stripe (ex. „facebook_A_ligheanul”).
// Nu folosește cookie-uri și nu stochează nimic în browser: citește doar
// adresa paginii curente, deci nu are nevoie de acord.

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const CHEI = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

// Stripe acceptă doar litere, cifre, „-” și „_” (UTM max 150, referința max 200).
function curata(v: string, max: number) {
  return v.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, max)
}

export default function UtmStripeCarte() {
  const pathname = usePathname()

  useEffect(() => {
    const sursa = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const k of CHEI) {
      const v = sursa.get(k)
      if (v) utm[k] = curata(v, 150)
    }
    if (!utm.utm_source) return

    const referinta = curata(
      [utm.utm_source, utm.utm_content || utm.utm_campaign].filter(Boolean).join('_'),
      200,
    )

    document.querySelectorAll<HTMLAnchorElement>('a[href*="buy.stripe.com"]').forEach((a) => {
      const url = new URL(a.href)
      for (const [k, v] of Object.entries(utm)) url.searchParams.set(k, v)
      url.searchParams.set('client_reference_id', referinta)
      a.href = url.toString()
    })
  }, [pathname])

  return null
}
