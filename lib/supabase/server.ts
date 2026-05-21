import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'

function cookieMethods(): CookieMethodsServer {
  const cookieStore = cookies()
  return {
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {}
    },
  }
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods(),
      cookieOptions: { maxAge: SESSION_MAX_AGE },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieMethods() }
  )
}
