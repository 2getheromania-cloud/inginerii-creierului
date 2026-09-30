'use client'

// Aterizarea linkului magic pentru „Cele 7 Etape".
//
// DE CE EXISTĂ O RUTĂ NOUĂ ȘI NU FOLOSIM /auth/confirm SAU /auth/callback:
// amândouă sfârșesc cu un redirect fix către /dashboard, adică spre programul
// de 6 luni. Un cumpărător al hărții n-are ce căuta acolo — nu are rând în
// `profiles`, nu are jurnal zilnic, nu are grup. Ruta asta face același lucru
// cu sesiunea, dar îl duce unde a plătit.
//
// Acoperă toate cele trei forme în care Supabase poate livra o sesiune, pentru
// că forma depinde de cum a fost cerut linkul, iar noi îl cerem din webhook:
//   • token-uri în fragmentul adresei (fluxul implicit) — nu ajung la server;
//   • ?code=… (PKCE);
//   • ?token_hash=…&type=magiclink.

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DESTINATIE = '/cele-7-etape'

export default function Intrare() {
  const searchParams = useSearchParams()
  const gata = useRef(false)
  const [eroare, setEroare] = useState<string | null>(null)

  useEffect(() => {
    if (gata.current) return
    gata.current = true

    const supabase = createClient()

    function reuseste() {
      // Reîncărcare completă, ca middleware-ul să vadă cookie-ul de sesiune.
      window.location.replace(DESTINATIE)
    }

    function esueaza(mesaj?: string) {
      setEroare(
        (mesaj ?? '').toLowerCase().includes('expired')
          ? 'Linkul a expirat. Cere altul și îl primești pe loc.'
          : 'Autentificarea nu a reușit. Cere un link nou.'
      )
    }

    async function intra() {
      // 1. Sesiune deja existentă — omul a revenit pe link a doua oară.
      const { data: existenta } = await supabase.auth.getSession()
      if (existenta.session?.user) return reuseste()

      // 2. Fluxul implicit: token-urile vin în fragment, nu în query.
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const errHash = hash.get('error_description') ?? hash.get('error')
      if (errHash) return esueaza(errHash)

      const access_token = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        return error ? esueaza(error.message) : reuseste()
      }

      // 3. PKCE.
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        return error ? esueaza(error.message) : reuseste()
      }

      // 4. Link de verificare clasic.
      const token_hash = searchParams.get('token_hash')
      if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'magiclink',
        })
        return error ? esueaza(error.message) : reuseste()
      }

      const errQuery =
        searchParams.get('error_description') ?? searchParams.get('error')
      esueaza(errQuery ?? 'link fără token')
    }

    intra()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (eroare) {
    return (
      <div className="max-w-prose">
        <h1 className="font-serif text-3xl">Linkul nu a mers</h1>
        <p className="mt-4">{eroare}</p>
        <p className="mt-4">
          <a
            href="/"
            className="font-semibold text-[#8F6E2A] underline underline-offset-4"
          >
            Cere un link nou
          </a>
        </p>
        <p className="mt-6 text-sm text-[#5E534A]">
          Folosește exact adresa de email cu care ai plătit. Accesul e legat de
          ea.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-prose">
      <h1 className="font-serif text-3xl">Se deschide programul…</h1>
      <p className="mt-4 text-[#5E534A]">Durează o secundă.</p>
    </div>
  )
}
