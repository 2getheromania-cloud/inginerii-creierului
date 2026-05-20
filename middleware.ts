import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refresh-uiește sesiunea și poate seta cookie-uri noi.
  // Orice redirect returnat trebuie să copieze acele cookie-uri,
  // altfel sesiunea pare invalidă pe cererea următoare → bucla de redirect.
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Copiază cookie-urile Supabase pe orice redirect — fix pentru bucla de redirect
  function redirectWithCookies(url: URL) {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value, { path: c.path, sameSite: c.sameSite as 'lax' | 'strict' | 'none' | undefined, httpOnly: c.httpOnly, secure: c.secure })
    )
    return res
  }

  const protectedPaths = ['/dashboard', '/istoric', '/resurse', '/profil', '/admin', '/chat']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // Utilizator neautentificat încearcă să acceseze rută protejată
  if (isProtected && !user) {
    return redirectWithCookies(new URL('/', request.url))
  }

  // Rută de admin accesată de non-admin
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return redirectWithCookies(new URL('/dashboard', request.url))
    }
  }

  // Utilizator autentificat la pagina de login → redirecționează
  if (pathname === '/' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return redirectWithCookies(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  // Exclude: fișiere statice, /auth/* (callback magic link), /api/* (cron + API routes)
  // Fără excludere pentru /auth/, middleware-ul ar putea șterge code-verifier-ul PKCE
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/|api/).*)'],
}
