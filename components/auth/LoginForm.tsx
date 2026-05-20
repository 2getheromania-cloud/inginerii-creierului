'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')
  const [redirectTo, setRedirectTo] = useState('')
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Preia eroarea din URL (?error=...) setată de callback
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    // iOS Safari kills session cookies when the tab is suspended; the PKCE
    // code_verifier stored client-side may be gone by the time the user taps
    // the link in Mail.app. Route iOS to the server-side callback which reads
    // cookies from the HTTP request rather than document.cookie.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const confirmPath = isIOS ? '/auth/callback' : '/auth/confirm'
    const redirectUrl = `${window.location.origin}${confirmPath}`

    // Save for debug display — if the link lands on homepage instead of this
    // URL, the Supabase Dashboard → Auth → URL Configuration allowlist is missing it.
    setRedirectTo(redirectUrl)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
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
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
          <p className="text-xs font-semibold text-gray-500 mb-1">Debug — redirect URL trimis:</p>
          <p className="text-xs font-mono text-gray-700 break-all">{redirectTo}</p>
          <p className="text-xs text-gray-400 mt-2">
            Dacă linkul duce pe homepage, adaugă acest URL în<br />
            Supabase Dashboard → Auth → URL Configuration → Redirect URLs
          </p>
        </div>

        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-4 text-brand-600 text-sm hover:underline"
        >
          Trimite alt email
        </button>
      </div>
    )
  }

  return (
    <div className="card max-w-sm w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Intră în cont</h2>
        <p className="text-gray-500 text-sm mt-1">Îți trimitem un link securizat pe email.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            {error.includes('expirat') && (
              <button
                type="button"
                onClick={() => setError('')}
                className="block mt-1 underline text-xs"
              >
                Solicită un link nou →
              </button>
            )}
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
