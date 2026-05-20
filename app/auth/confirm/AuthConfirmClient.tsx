'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EmailOtpType } from '@supabase/supabase-js'

export default function AuthConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    async function confirm() {
      const code       = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type       = searchParams.get('type') as EmailOtpType | null
      const errorParam = searchParams.get('error')
      const errorDesc  = searchParams.get('error_description')

      if (errorParam) {
        router.replace(`/?error=${encodeURIComponent(errorDesc ?? errorParam)}`)
        return
      }

      if (!code && !token_hash) {
        router.replace(`/?error=${encodeURIComponent('Link invalid.')}`)
        return
      }

      let authError = null

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        authError = error
      } else if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        authError = error
      }

      if (authError) {
        const msg = authError.message.includes('expired')
          ? 'Link-ul a expirat. Te rugăm să soliciți un link nou.'
          : 'Autentificare eșuată. Încearcă din nou.'
        router.replace(`/?error=${encodeURIComponent(msg)}`)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/?error=${encodeURIComponent('Sesiune invalidă.')}`)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard')
    }

    confirm()
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
