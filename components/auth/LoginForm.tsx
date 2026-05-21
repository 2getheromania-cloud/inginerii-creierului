'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createClient as createVanillaClient } from '@supabase/supabase-js'

// Vanilla client — implicit flow, no PKCE, no cookies.
// Used only for SENDING requests (signInWithOtp).
// Verification and session persistence happen via the SSR browser client.
function vanillaImplicit() {
  return createVanillaClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', persistSession: false, detectSessionInUrl: false } }
  )
}

type Screen = 'email' | 'otp-sent' | 'magic-sent'

export default function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const supabase    = createClient()  // SSR client — persists session in cookies

  const [email,     setEmail]     = useState('')
  const [otp,       setOtp]       = useState('')
  const [screen,    setScreen]    = useState<Screen>('email')
  const [loading,   setLoading]   = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [error,     setError]     = useState('')
  const [preferOTP, setPreferOTP] = useState(false)

  useEffect(() => {
    const urlError = params.get('error')
    if (urlError) setError(decodeURIComponent(urlError))

    // Prefer OTP for: standalone PWA (installed) or any mobile device
    const isPWA    = window.matchMedia('(display-mode: standalone)').matches
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setPreferOTP(isPWA || isMobile)
  }, [params])

  // ── Send OTP (mobile/PWA) ─────────────────────────────────────────────────
  async function sendOTP() {
    const addr = email.trim().toLowerCase()
    if (!addr) return
    setLoading(true)
    setError('')

    // No emailRedirectTo, no PKCE — pure OTP code sent to inbox
    const { error: err } = await vanillaImplicit().auth.signInWithOtp({ email: addr })

    setLoading(false)
    if (err) { setError(err.message); return }
    setOtp('')
    setScreen('otp-sent')
  }

  // ── Resend OTP (stay on OTP screen) ──────────────────────────────────────
  async function resendOTP() {
    const addr = email.trim().toLowerCase()
    setLoading(true)
    setError('')
    setOtp('')
    const { error: err } = await vanillaImplicit().auth.signInWithOtp({ email: addr })
    setLoading(false)
    if (err) { setError(err.message); return }
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  async function verifyOTP() {
    if (otp.length !== 6) return
    setVerifying(true)
    setError('')

    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type:  'email',
    })

    if (err) {
      setVerifying(false)
      setError(
        err.message.toLowerCase().includes('expired') || err.message.toLowerCase().includes('invalid')
          ? 'Cod invalid sau expirat. Apasă „Retrimite codul" pentru a primi un cod nou.'
          : err.message
      )
      return
    }

    if (data.user) {
      const { data: prof } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()
      router.push((prof as { role?: string } | null)?.role === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    }
  }

  // ── Send magic link (desktop fallback) ───────────────────────────────────
  async function sendMagicLink() {
    const addr = email.trim().toLowerCase()
    if (!addr) return
    setLoading(true)
    setError('')

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isIOS) {
      const { error: err } = await vanillaImplicit().auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/auth/implicit-callback` },
      })
      setLoading(false)
      if (err) { setError(err.message); return }
    } else {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      })
      setLoading(false)
      if (err) { setError(err.message); return }
    }
    setScreen('magic-sent')
  }

  // ── Screen: OTP code entry ────────────────────────────────────────────────
  if (screen === 'otp-sent') {
    return (
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📲</div>
          <h2 className="text-xl font-bold text-gray-900">Introdu codul</h2>
          <p className="text-gray-500 text-sm mt-1">
            Ți-am trimis un cod de autentificare pe email la{' '}
            <strong className="text-gray-700 break-all">{email}</strong>.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Cod primit pe email</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={e => {
                setError('')
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              onKeyDown={e => { if (e.key === 'Enter') verifyOTP() }}
              className="input text-center text-2xl tracking-[0.5em] font-bold placeholder:tracking-normal"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {resent && (
            <div className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2 text-center">
              Cod retrimis! Verifică emailul.
            </div>
          )}

          <button
            onClick={verifyOTP}
            disabled={otp.length !== 6 || verifying}
            className="btn-primary w-full disabled:opacity-60"
          >
            {verifying ? 'Se verifică...' : 'Autentifică-mă'}
          </button>

          <button
            onClick={resendOTP}
            disabled={loading}
            className="w-full text-sm text-brand-600 hover:underline disabled:opacity-50"
          >
            {loading ? 'Se retrimite...' : 'Retrimite codul'}
          </button>

          <button
            onClick={() => { setScreen('email'); setOtp(''); setError('') }}
            className="w-full text-xs text-gray-400 hover:text-gray-600"
          >
            ← Schimbă emailul
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Codul expiră în 1 oră. Verifică și folderul Spam dacă nu l-ai primit.
        </p>
      </div>
    )
  }

  // ── Screen: magic link sent ───────────────────────────────────────────────
  if (screen === 'magic-sent') {
    return (
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifică emailul!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Am trimis un link de autentificare la <strong>{email}</strong>.
          Click pe link pentru a intra în cont.
        </p>
        <p className="text-xs text-gray-400">Link-ul expiră în 1 oră.</p>
        <button
          onClick={() => { setScreen('email'); setEmail(''); setError('') }}
          className="mt-4 text-brand-600 text-sm hover:underline"
        >
          Trimite alt email
        </button>
      </div>
    )
  }

  // ── Screen: email input ───────────────────────────────────────────────────
  return (
    <div className="card max-w-sm w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Intră în cont</h2>
        <p className="text-gray-500 text-sm mt-1">
          {preferOTP
            ? 'Îți trimitem un cod numeric de 6 cifre pe email.'
            : 'Îți trimitem un link securizat pe email.'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Adresa de email</label>
          <input
            type="email"
            className="input"
            placeholder="email@exemplu.ro"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            onKeyDown={e => {
              if (e.key === 'Enter') preferOTP ? sendOTP() : sendMagicLink()
            }}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={preferOTP ? sendOTP : sendMagicLink}
          disabled={loading || !email.trim()}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading
            ? 'Se trimite...'
            : preferOTP
            ? 'Trimite codul de autentificare'
            : 'Trimite link de autentificare'}
        </button>

        {/* Method toggle */}
        <button
          onClick={() => { setPreferOTP(v => !v); setError('') }}
          className="w-full text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          {preferOTP
            ? 'Folosește magic link în schimb →'
            : 'Folosește cod numeric în schimb →'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        {preferOTP
          ? 'Codul este valid 1 oră. Nu ai nevoie de parolă.'
          : 'Nu este nevoie de parolă. Link-ul este valid 1 oră.'}
      </p>
    </div>
  )
}
