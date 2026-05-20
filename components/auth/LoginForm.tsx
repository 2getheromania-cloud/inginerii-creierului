'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── iOS OTP helpers using direct REST (zero SDK, zero PKCE) ──────────────
// The Supabase JS SDK (@supabase/ssr) hard-codes flowType:'pkce'.
// Even @supabase/supabase-js v2 defaults to 'pkce' now.
// Any SDK call to signInWithOtp sends code_challenge to GoTrue, which binds
// the OTP to that PKCE verifier.  verifyOtp then must supply code_verifier —
// but iOS sends 0 cookies, so it fails with "Token has expired or is invalid".
// Direct REST bypasses all SDK flow-type logic entirely.

async function restSignInOTP(email: string): Promise<{
  ok: boolean
  status: number
  body: Record<string, unknown>
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`,
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        email,
        create_user: true,
        // Intentionally NO code_challenge and NO redirect_to
      }),
    }
  )
  const body = await res.json().catch(() => ({})) as Record<string, unknown>
  return { ok: res.ok, status: res.status, body }
}

async function restVerifyOTP(
  email: string,
  token: string,
  type: string,
): Promise<{
  ok: boolean
  status: number
  body: Record<string, unknown>
  session: { access_token: string; refresh_token: string } | null
}> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
    {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ email, token, type }),
    }
  )
  const body = await res.json().catch(() => ({})) as Record<string, unknown>
  const session =
    typeof body.access_token === 'string' && typeof body.refresh_token === 'string'
      ? { access_token: body.access_token, refresh_token: body.refresh_token }
      : null
  return { ok: res.ok, status: res.status, body, session }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function LoginForm() {
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')
  const [otpCode, setOtpCode]     = useState('')
  const [isIOS, setIsIOS]         = useState(false)
  const [signInDbg, setSignInDbg] = useState<Record<string, unknown> | null>(null)
  const [verifyDbg, setVerifyDbg] = useState<Record<string, unknown> | null>(null)
  const [redirectTo, setRedirectTo] = useState('') // desktop debug

  const searchParams = useSearchParams()
  const supabase     = createClient() // SSR cookie client (PKCE) — used only for desktop & post-auth

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [searchParams])

  // ── Email submit ──────────────────────────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSignInDbg(null)
    setVerifyDbg(null)

    const emailClean = email.trim().toLowerCase()

    if (isIOS) {
      const callInfo = {
        method:  'POST',
        url:     `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`,
        body:    { email: emailClean, create_user: true },
        note:    'REST — no SDK, no code_challenge, no redirect_to',
        ts:      new Date().toISOString(),
      }
      console.log('[OTP] signIn call', callInfo)

      const { ok, status, body } = await restSignInOTP(emailClean)
      const dbg = { ...callInfo, response: { ok, status, body } }
      setSignInDbg(dbg)
      console.log('[OTP] signIn response', dbg.response)

      setLoading(false)
      if (!ok) {
        const msg = (body.message ?? body.error_description ?? body.error ?? 'Eroare la trimitere') as string
        setError(String(msg))
        return
      }
      setSent(true)
    } else {
      const url = `${window.location.origin}/auth/confirm`
      setRedirectTo(url)
      const { error: err } = await supabase.auth.signInWithOtp({
        email: emailClean,
        options: { emailRedirectTo: url },
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setSent(true)
    }
  }

  // ── OTP verify (iOS) ──────────────────────────────────────────────────────
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = otpCode.replace(/\D/g, '').trim()
    if (token.length < 6) return
    setLoading(true)
    setError('')
    setVerifyDbg(null)

    const emailClean = email.trim().toLowerCase()
    const types = ['email', 'magiclink', 'signup'] as const

    const attempts: Array<{
      type: string
      ok: boolean
      status: number
      error: string | null
      hasSession: boolean
      rawBody: Record<string, unknown>
    }> = []

    let successTokens: { access_token: string; refresh_token: string } | null = null

    for (const type of types) {
      const { ok, status, body, session } = await restVerifyOTP(emailClean, token, type)
      const attempt = {
        type,
        ok:         ok && !!session,
        status,
        error:      ok && session ? null : String(body.message ?? body.error_description ?? body.error ?? '—'),
        hasSession: !!session,
        rawBody:    body,
      }
      attempts.push(attempt)
      console.log('[OTP] verify attempt', attempt)

      if (session) {
        successTokens = session
        break
      }
    }

    const dbg = { email: emailClean, token, tokenLength: token.length, attempts }
    setVerifyDbg(dbg)
    console.log('[OTP] verify summary', dbg)

    if (!successTokens) {
      setLoading(false)
      const lastErr = attempts[attempts.length - 1]?.error ?? 'Eroare necunoscută'
      setError(`Toate tipurile au eșuat. Ultimul: ${lastErr}`)
      return
    }

    // Transfer session to SSR cookie client so Next.js middleware can auth next request
    await supabase.auth.setSession(successTokens)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('Sesiune invalidă după setSession.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
  }

  // ── iOS: OTP input screen ─────────────────────────────────────────────────
  if (sent && isIOS) {
    return (
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Introdu codul</h2>
          <p className="text-gray-500 text-sm">
            Ți-am trimis un cod de autentificare la <strong>{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleOtpVerify} className="space-y-4">
          <div>
            <label className="label">Cod primit pe email</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="input text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? 'Se verifică...' : 'Autentifică-mă'}
          </button>
        </form>

        {/* Debug panel — always visible, no DevTools needed on iPhone */}
        <div className="mt-4 space-y-2">
          {signInDbg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1">signIn REST:</p>
              <pre className="text-xs font-mono text-blue-800 whitespace-pre-wrap break-all">
                {JSON.stringify(signInDbg, null, 2)}
              </pre>
            </div>
          )}
          {verifyDbg && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">verify REST:</p>
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">
                {JSON.stringify(verifyDbg, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Codul expiră în 1 oră.{' '}
          <button
            type="button"
            onClick={() => { setSent(false); setOtpCode(''); setError(''); setSignInDbg(null); setVerifyDbg(null) }}
            className="text-brand-600 underline"
          >
            Retrimite codul
          </button>
        </p>
      </div>
    )
  }

  // ── Desktop: magic link sent screen ──────────────────────────────────────
  if (sent && !isIOS) {
    return (
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifică emailul!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Am trimis un link de autentificare la <strong>{email}</strong>.
          Click pe link pentru a intra în cont.
        </p>
        <p className="text-xs text-gray-400">Link-ul expiră în 1 oră.</p>
        {redirectTo && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
            <p className="text-xs font-semibold text-gray-500 mb-1">Debug — redirect URL:</p>
            <p className="text-xs font-mono text-gray-700 break-all">{redirectTo}</p>
          </div>
        )}
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-4 text-brand-600 text-sm hover:underline"
        >
          Trimite alt email
        </button>
      </div>
    )
  }

  // ── Email input form ──────────────────────────────────────────────────────
  return (
    <div className="card max-w-sm w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Intră în cont</h2>
        <p className="text-gray-500 text-sm mt-1">
          {isIOS
            ? 'Îți trimitem un cod de autentificare pe email.'
            : 'Îți trimitem un link securizat pe email.'}
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="label">Adresa de email</label>
          <input
            type="email"
            className="input"
            placeholder="email@exemplu.ro"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading
            ? 'Se trimite...'
            : isIOS
            ? 'Trimite cod de autentificare'
            : 'Trimite link de autentificare'}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        {isIOS
          ? 'Vei primi un cod numeric de 6 cifre, valid 1 oră.'
          : 'Nu este nevoie de parolă. Vei primi un link securizat valid 1 oră.'}
      </p>
    </div>
  )
}
