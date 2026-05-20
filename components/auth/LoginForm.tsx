'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isIOS, setIsIOS]     = useState(false)
  // Temporary debug — shows exact redirectTo used; remove after confirming desktop flow
  const [redirectTo, setRedirectTo] = useState('')

  const searchParams = useSearchParams()
  const router       = useRouter()
  const supabase     = createClient()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [searchParams])

  // ── Email submit: two distinct flows ─────────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    if (isIOS) {
      // OTP flow — no emailRedirectTo → Supabase sends 6-digit code, no PKCE
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setSent(true)
    } else {
      // Desktop magic link with PKCE
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

  // ── OTP verify (iOS only) ─────────────────────────────────────────────────
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.trim().length < 6) return
    setLoading(true)
    setError('')

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otpCode.trim(),
      type:  'email',
    })

    if (verifyErr) {
      setLoading(false)
      setError(verifyErr.message)
      return
    }

    // Session stored client-side — fetch role then do full reload so
    // middleware picks up the new cookies on the next server request.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('Sesiune invalidă după verificare.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Full reload ensures the session cookie reaches the server middleware
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
            Ți-am trimis un cod de autentificare la{' '}
            <strong>{email}</strong>.
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
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading || otpCode.length < 6}>
            {loading ? 'Se verifică...' : 'Autentifică-mă'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Codul expiră în 1 oră.{' '}
          <button
            type="button"
            onClick={() => { setSent(false); setOtpCode(''); setError('') }}
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

        {/* DEBUG TEMPORAR — șterge după ce confirmi că redirect-ul funcționează */}
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

  // ── Email input form (both platforms) ────────────────────────────────────
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
