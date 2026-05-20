'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createClient as createVanillaClient } from '@supabase/supabase-js'

// Vanilla client with implicit flow — no PKCE, no cookies needed at callback time.
// Used for iOS where Mail.app opens links in a cookie-less Safari context.
function getImplicitClient() {
  return createVanillaClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType:          'implicit',
        persistSession:    false,
        detectSessionInUrl: false,
      },
    }
  )
}

export default function LoginForm() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [isIOS, setIsIOS]   = useState(false)

  const searchParams = useSearchParams()
  const supabase     = createClient()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [searchParams])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const emailClean = email.trim().toLowerCase()

    if (isIOS) {
      const { error: err } = await getImplicitClient().auth.signInWithOtp({
        email: emailClean,
        options: { emailRedirectTo: `${window.location.origin}/auth/implicit-callback` },
      })

      setLoading(false)
      if (err) { setError(err.message); return }
      setSent(true)
    } else {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: emailClean,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      })

      setLoading(false)
      if (err) { setError(err.message); return }
      setSent(true)
    }
  }

  // ── Sent screen (same for iOS and desktop) ────────────────────────────────
  if (sent) {
    return (
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">&#128231;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifică emailul!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Am trimis un link de autentificare la <strong>{email}</strong>.
          Click pe link pentru a intra în cont.
        </p>
        <p className="text-xs text-gray-400">Link-ul expiră în 1 oră.</p>
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
          Îți trimitem un link securizat pe email.
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
          {loading ? 'Se trimite...' : 'Trimite link de autentificare'}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Nu este nevoie de parolă. Vei primi un link securizat valid 1 oră.
      </p>
    </div>
  )
}
