import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/documente') || pathname.startsWith('/mesaje')) {
    return NextResponse.next()
  }

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

  function redirectWithCookies(url: URL) {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c =>
      res.cookies.set(c.name, c.value, {
        path: c.path,
        sameSite: c.sameSite as 'lax' | 'strict' | 'none' | undefined,
        httpOnly: c.httpOnly,
        secure: c.secure,
      })
    )
    return res
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const protectedPaths = [
      '/dashboard', '/istoric', '/resurse', '/profil',
      '/admin', '/chat',
    ]
    const isProtected = protectedPaths.some(p => pathname.startsWith(p))

    if (isProtected && !user) {
      return redirectWithCookies(new URL('/', request.url))
    }

    if (pathname.startsWith('/admin') && user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (error) {
        console.error('[middleware] profile fetch error (admin check):', error.message)
      } else if (profile?.role !== 'admin') {
        return redirectWithCookies(new URL('/dashboard', request.url))
      }
    }

    if (pathname === '/' && user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (error) {
        console.error('[middleware] profile fetch error (login redirect):', error.message)
      } else {
        const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
        return redirectWithCookies(new URL(dest, request.url))
      }
    }
  } catch (err) {
    console.error('[middleware] unexpected error:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/|api/).*)'],
}
