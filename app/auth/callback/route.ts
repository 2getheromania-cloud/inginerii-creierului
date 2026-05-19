import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Supabase poate trimite erori explicit în URL (ex. link expirat pe server)
  const errorParam = searchParams.get('error')
  const errorDesc  = searchParams.get('error_description')
  if (errorParam) {
    const msg = errorDesc ?? errorParam
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(msg)}`)
  }

  const code       = searchParams.get('code')        // PKCE flow
  const token_hash = searchParams.get('token_hash')  // OTP flow fallback
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/dashboard'

  if (!code && !token_hash) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('Link invalid.')}`)
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

  let authError = null

  if (code) {
    // Flow PKCE — implicit folosit de signInWithOtp cu emailRedirectTo
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  } else if (token_hash && type) {
    // Flow OTP direct — fallback când PKCE verifier lipsește (alt browser/dispozitiv)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    authError = error
  }

  if (authError) {
    console.error('[auth/callback] error:', authError.message)
    const msg = authError.message.includes('expired')
      ? 'Link-ul a expirat. Te rugăm să soliciți un link nou.'
      : 'Autentificare eșuată. Încearcă din nou.'
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(msg)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('Sesiune invalidă.')}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const dest = profile?.role === 'admin' ? '/admin' : next
  return NextResponse.redirect(`${origin}${dest}`)
}
