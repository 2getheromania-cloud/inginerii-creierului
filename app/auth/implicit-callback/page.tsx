'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ImplicitCallbackPage() {
  const done = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function handle() {
      // The implicit flow delivers tokens in the URL hash — never sent to server
      const hash = window.location.hash.slice(1) // strip leading '#'
      const params = new URLSearchParams(hash)

      const errorParam = params.get('error')
      const errorDesc  = params.get('error_description')

      if (errorParam) {
        setError(errorDesc ?? errorParam)
        return
      }

      const access_token  = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (!access_token || !refresh_token) {
        setError('Link invalid — tokenii lipsesc din URL.')
        return
      }

      const supabase = createClient()

      const { data: { session }, error: sessionErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (sessionErr || !session?.user) {
        setError(sessionErr?.message ?? 'Sesiune invalidă după setSession.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Full reload so Next.js middleware picks up the new session cookie
      window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
    }

    handle()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-3xl mb-3">&#10060;</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Autentificare eșuată</h2>
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words mb-4">
            {error}
          </p>
          <a href="/" className="btn-primary w-full text-center block">
            Solicită un link nou
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-3">&#9203;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Se autentifică...</h2>
        <p className="text-gray-500 text-sm">Te rugăm să aștepți câteva secunde.</p>
      </div>
    </div>
  )
}
