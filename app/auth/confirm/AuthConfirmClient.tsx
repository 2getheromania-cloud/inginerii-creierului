'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = useRef(false)
  const [phase, setPhase]     = useState<'loading' | 'error'>('loading')
  const [errorText, setError] = useState('')

  useEffect(() => {
    if (done.current) return
    done.current = true

    const code     = searchParams.get('code')
    const th       = searchParams.get('token_hash')
    const errParam = searchParams.get('error')
    const errDesc  = searchParams.get('error_description')

    if (errParam) {
      setError(errDesc ?? errParam)
      setPhase('error')
      return
    }

    if (!code && !th) {
      setError('Link invalid — te rugăm să soliciți un link nou.')
      setPhase('error')
      return
    }

    const supabase = createClient()

    let resolved = false

    async function doRedirect(userId: string) {
      if (resolved) return
      resolved = true

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard')
    }

    function doFail(supabaseMsg?: string) {
      if (resolved) return
      resolved = true
      sub.unsubscribe()
      clearTimeout(timer)
      const msg = supabaseMsg ?? ''
      setError(
        msg.toLowerCase().includes('expired')
          ? 'Link-ul a expirat. Te rugăm să soliciți un link nou.'
          : 'Autentificare eșuată. Te rugăm să soliciți un link nou.'
      )
      setPhase('error')
    }

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          sub.unsubscribe()
          clearTimeout(timer)
          doRedirect(session.user.id)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) doRedirect(session.user.id)
      else if (error)    doFail(error.message)
    })

    const timer = setTimeout(() => doFail(), 12000)

    return () => { sub.unsubscribe(); clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-3xl mb-3">&#10060;</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Autentificare eșuată</h2>
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words mb-4">
            {errorText}
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
