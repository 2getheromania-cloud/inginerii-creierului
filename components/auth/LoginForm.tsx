'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient as createVanillaClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// ── Non-PKCE client for iOS OTP ───────────────────────────────────────────
// createBrowserClient (@supabase/ssr) hard-codes flowType:'pkce', which makes
// signInWithOtp attach a code_challenge to the request. Supabase then binds
// the OTP to that PKCE challenge. When verifyOtp runs, the SDK reads the
// code_verifier from cookies — but iOS Safari sends 0 cookies (confirmed:
// totalCount=0 in debug). Verification fails with "Token has expired or is invalid".
//
// Fix: use vanilla @supabase/supabase-js with flowType:'implicit'.
// No code_challenge is sent → OTP is plain → verifyOtp needs no code_verifier.
// After verification, we transfer the session to the SSR cookie client so the
// Next.js middleware can read it on the next server request.
let _otpClient: ReturnType<typeof createVanillaClient> | null = null
function getOTPClient() {
  if (_otpClient) return _otpClient
  _otpClient = createVanillaClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType:       'implicit', // explicit non-PKCE — no code_challenge
        persistSession: false,      // session lives only for this verification;
                                    // we transfer it to the SSR cookie client
      },
    }
  )
  return _otpClient
}

export default function LoginForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isIOS, setIsIOS]     = useState(false)
  const [otpDebug, setOtpDebug] = useState<Record<string, unknown> | null>(null)
  // Temporary — shows redirectTo so desktop redirect can be verified
  const [redirectTo, setRedirectTo] = useState('')

  const searchParams = useSearchParams()
  const supabase     = createClient() // SSR client (cookie-based, PKCE)

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
    setOtpDebug(null)

    if (isIOS) {
      // OTP flow: non-PKCE client, no emailRedirectTo
      // → Supabase sends 6-digit code, OTP is NOT bound to a PKCE challenge
      const { error: err } = await getOTPClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setSent(true)
    } else {
      // Desktop: magic link with PKCE via SSR client
      const url = `${window.location.origin}/auth/confirm`
      setRedirectTo(url)
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
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
    const token = otpCode.trim()
    if (token.length < 6) return
    setLoading(true)
    setError('')

    const payload = {
      email: email.trim().toLowerCase(),
      tokenLength: token.length,
      token,        // visible in UI for cross-checking with what Supabase sent
      type: 'email',
    }
    console.log('[OTP] verifyOtp payload:', payload)
    setOtpDebug(payload)

    const { data, error: verifyErr } = await getOTPClient().auth.verifyOtp({
      email: payload.email,
      token,
      type:  'email',
    })

    const result = { ok: !verifyErr, error: verifyErr?.message ?? null, hasSession: !!data?.session }
    console.log('[OTP] verifyOtp result:', result)
    setOtpDebug(prev => ({ ...prev as object, result }))

    if (verifyErr) {
      setLoading(false)
      setError(`verifyOtp: ${verifyErr.message}`)
      return
    }

    if (!data?.session) {
      setLoading(false)
      setError('verifyOtp a reușit dar sesiunea lipsește.')
      return
    }

    // Transfer session from non-PKCE vanilla client → SSR cookie client.
    // This writes the access+refresh tokens to document.cookie (maxAge 7 days)
    // so the Next.js middleware can authenticate the next server request.
    await supabase.auth.setSession({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

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

    // Full page reload so middleware reads the freshly-written cookie
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

        {/* Debug panel — visible on iPhone without DevTools */}
        {otpDebug && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Debug OTP:</p>
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(otpDebug, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Codul expiră în 1 oră.{' '}
          <button
            type="button"
            onClick={() => { setSent(false); setOtpCode(''); setError(''); setOtpDebug(null) }}
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

        {/* DEBUG TEMPORAR */}
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
