import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const errorParam = searchParams.get('error')
  const errorDesc  = searchParams.get('error_description')
  const next       = searchParams.get('next') ?? '/dashboard'

  function fail(msg: string) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(msg)}`
    )
  }

  if (errorParam) {
    return fail(errorDesc ?? errorParam)
  }

  if (!code && !token_hash) {
    return fail('Link invalid.')
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  let authError: { message: string } | null = null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error ?? null
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    authError = error ?? null
  }

  // Fallback: if PKCE failed but a token_hash is also present, try verifyOtp
  if (authError && code && token_hash && type) {
    const { error: fbErr } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!fbErr) authError = null
  }

  if (authError) {
    const display = authError.message.toLowerCase().includes('expired')
      ? 'Link-ul a expirat. Solicită un link nou.'
      : 'Autentificare eșuată. Solicită un link nou.'
    return fail(display)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return fail('Sesiune invalidă. Te rugăm să soliciți un link nou.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const dest = profile?.role === 'admin' ? '/admin' : next
  return NextResponse.redirect(`${origin}${dest}`)
}
