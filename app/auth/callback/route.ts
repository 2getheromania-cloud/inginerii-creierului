import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDesc  = searchParams.get('error_description')
  const next       = searchParams.get('next') ?? '/dashboard'

  function fail(msg: string) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(msg)}`)
  }

  if (errorParam) return fail(errorDesc ?? errorParam)
  if (!code)      return fail('Link invalid.')

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
      // Ensure session cookies are persistent (survive browser restarts)
      cookieOptions: { maxAge: 60 * 60 * 24 * 30 },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const display = error.message.toLowerCase().includes('expired')
      ? 'Link-ul a expirat. Solicită un link nou.'
      : 'Autentificare eșuată. Solicită un link nou.'
    return fail(display)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Sesiune invalidă. Te rugăm să soliciți un link nou.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return NextResponse.redirect(`${origin}${profile?.role === 'admin' ? '/admin' : next}`)
}
