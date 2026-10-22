'use client'

// Pixelul Meta pentru paginile cărții „Corpul nu citește Facebook”.
// Se încarcă DOAR după acordul vizitatorului (ePrivacy + GDPR) și DOAR pe
// paginile cărții, nu în zona privată a cursanților.
// Evenimente: PageView, ViewContent (pagina cărții), InitiateCheckout (clic pe
// butonul de plată Stripe), Purchase (pagina /multumim, 99 RON).

import { useEffect, useState, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import { LEGAL } from '@/components/legal/LegalFooter'

const PIXEL_ID = '418229110969839'
const CHEIE_ACORD = 'ic_cookie_acord_marketing' // 'da' | 'nu'
const PRET = 99
const MONEDA = 'RON'
const CONTINUT = {
  content_ids: ['corpul-nu-citeste-facebook'],
  content_name: 'Corpul nu citește Facebook',
  content_type: 'product',
}

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] }
declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq }
}

function citesteAcord(): string | null {
  try { return window.localStorage.getItem(CHEIE_ACORD) } catch { return null }
}
function scrieAcord(v: 'da' | 'nu') {
  try { window.localStorage.setItem(CHEIE_ACORD, v) } catch { /* fără stocare: întrebăm din nou */ }
}

// Codul oficial Meta, încărcat o singură dată, numai după acord.
function incarcaPixel() {
  if (typeof window === 'undefined' || window.fbq) return
  const n: Fbq = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = n as any
    if (self.callMethod) self.callMethod(...args)
    else self.queue.push(args)
  } as Fbq
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = n as any
  f.push = n; f.loaded = true; f.version = '2.0'; f.queue = []
  window.fbq = n
  window._fbq = n
  const t = document.createElement('script')
  t.async = true
  t.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(t)
  window.fbq('init', PIXEL_ID)
}

function trimite(eveniment: string, date?: Record<string, unknown>, eventID?: string) {
  if (!window.fbq) return
  if (eventID) window.fbq('track', eveniment, date ?? {}, { eventID })
  else if (date) window.fbq('track', eveniment, date)
  else window.fbq('track', eveniment)
}

// Purchase o singură dată pe sesiunea de plată (un refresh nu dublează vânzarea).
function trimiteCumparare() {
  const params = new URLSearchParams(window.location.search)
  const sesiune = params.get('session_id') || params.get('checkout_session_id')
  const cheie = `ic_purchase_${sesiune ?? 'fara-sesiune'}`
  try {
    if (window.sessionStorage.getItem(cheie)) return
    window.sessionStorage.setItem(cheie, '1')
  } catch { /* continuăm fără protecție la refresh */ }
  trimite('Purchase', { ...CONTINUT, value: PRET, currency: MONEDA, num_items: 1 },
    sesiune ? `purchase_${sesiune}` : undefined)
}

export default function MetaPixelCarte() {
  const pathname = usePathname()
  // undefined = încă nu am citit; null = nu a ales; 'da' | 'nu'
  const [acord, setAcord] = useState<string | null | undefined>(undefined)

  useEffect(() => { setAcord(citesteAcord()) }, [])

  // Evenimentele paginii curente, doar cu acord.
  useEffect(() => {
    if (acord !== 'da') return
    incarcaPixel()
    trimite('PageView')
    if (pathname?.endsWith('/multumim')) trimiteCumparare()
    else if (pathname === '/carte/corpul-nu-citeste-facebook') {
      trimite('ViewContent', { ...CONTINUT, value: PRET, currency: MONEDA })
    }
  }, [acord, pathname])

  // Clic pe orice buton de plată Stripe → InitiateCheckout.
  useEffect(() => {
    if (acord !== 'da') return
    function laClic(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href*="buy.stripe.com"]')
      if (a) trimite('InitiateCheckout', { ...CONTINUT, value: PRET, currency: MONEDA, num_items: 1 })
    }
    document.addEventListener('click', laClic, true)
    return () => document.removeEventListener('click', laClic, true)
  }, [acord])

  function alege(v: 'da' | 'nu') {
    scrieAcord(v)
    setAcord(v)
  }

  if (acord !== null) return null

  // „Accept” și „Refuz” au aceeași greutate vizuală, cum cer ghidurile UE.
  const buton: CSSProperties = {
    flex: '1 1 140px', padding: '12px 18px', borderRadius: 999, fontSize: 15,
    fontWeight: 600, cursor: 'pointer', border: '1.5px solid #f4efe4',
    fontFamily: 'inherit',
  }
  return (
    <div role="dialog" aria-live="polite" aria-label="Acord pentru cookie-uri"
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 1000,
        maxWidth: 560, margin: '0 auto', background: '#1a3a2a', color: '#f4efe4',
        borderRadius: 16, padding: '18px 20px', boxShadow: '0 10px 30px rgba(0,0,0,.25)',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', fontSize: 15, lineHeight: 1.5,
      }}>
      <p style={{ margin: '0 0 14px' }}>
        Folosim un cookie de la Meta (Facebook) ca să aflăm dacă reclamele noastre
        te-au ajutat să găsești cartea. Îl activăm doar dacă ești de acord.{' '}
        <a href={LEGAL.cookies} target="_blank" rel="noopener"
          style={{ color: '#e8c77a', textDecoration: 'underline' }}>Politica de cookie-uri</a>
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => alege('nu')}
          style={{ ...buton, background: 'transparent', color: '#f4efe4' }}>Refuz</button>
        <button type="button" onClick={() => alege('da')}
          style={{ ...buton, background: '#f4efe4', color: '#1a3a2a' }}>Accept</button>
      </div>
    </div>
  )
}
