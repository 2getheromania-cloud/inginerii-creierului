'use client'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Guard against React Strict Mode double-mount and navigation re-renders
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const code       = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type')
    const errorParam = searchParams.get('error')
    const errorDesc  = searchParams.get('error_description')

    // Structured log — visible in mobile Safari DevTools / Vercel logs
    console.log('[auth/confirm] mount', {
      code:       code       ? `${code.slice(0, 8)}…` : null,
      token_hash: token_hash ? `${token_hash.slice(0, 8)}…` : null,
      type,
      error: errorParam ?? null,
    })

    if (errorParam) {
      console.warn('[auth/confirm] URL error param:', errorParam, errorDesc)
      router.replace(`/?error=${encodeURIComponent(errorDesc ?? errorParam)}`)
      return
    }

    if (!code && !token_hash) {
      console.warn('[auth/confirm] no code or token_hash in URL')
      router.replace(`/?error=${encodeURIComponent('Link invalid.')}`)
      return
    }

    // createBrowserClient sets detectSessionInUrl: true — the SDK auto-exchanges
    // the ?code= from the URL when the client initialises (async, internal call).
    // Calling exchangeCodeForSession manually here would be a SECOND call on the
    // same code → "invalid or has expired". Instead we subscribe to onAuthStateChange
    // and let the SDK drive the exchange.
    const supabase = createClient()
    let resolved = false

    async function redirect(userId: string) {
      if (resolved) return
      resolved = true
      console.log('[auth/confirm] session ok, userId:', userId)

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileErr) console.warn('[auth/confirm] profile fetch error:', profileErr.message)

      router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard')
    }

    function fail(reason: string) {
      if (resolved) return
      resolved = true
      console.error('[auth/confirm] failed:', reason)
      const msg = reason.toLowerCase().includes('expired')
        ? 'Link-ul a expirat. Te rugăm să soliciți un link nou.'
        : 'Autentificare eșuată. Încearcă din nou.'
      subscription.unsubscribe()
      clearTimeout(timeout)
      router.replace(`/?error=${encodeURIComponent(msg)}`)
    }

    // Primary: listen for the SIGNED_IN event emitted after auto-exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth/confirm] onAuthStateChange:', event,
        'user:', session?.user?.id ?? null)

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        subscription.unsubscribe()
        clearTimeout(timeout)
        redirect(session.user.id)
      }
    })

    // Secondary: getSession() covers the race where SIGNED_IN fired before we subscribed
    supabase.auth.getSession().then(({ data: { session }, error: sessionErr }) => {
      console.log('[auth/confirm] getSession:', {
        userId: session?.user?.id ?? null,
        error:  sessionErr?.message ?? null,
      })
      if (session?.user) redirect(session.user.id)
      else if (sessionErr)  fail(sessionErr.message)
    })

    // 12 s fallback — covers cases where neither event fires (e.g. in-app browser
    // with no localStorage access to the PKCE verifier)
    const timeout = setTimeout(() => fail('timeout — no session after 12s'), 12000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Se autentifică...</h2>
        <p className="text-gray-500 text-sm">Te rugăm să aștepți câteva secunde.</p>
      </div>
    </div>
  )
}
