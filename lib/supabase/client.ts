'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // iOS Safari kills session cookies when the tab is suspended between
        // requesting a magic link and clicking it. Persistent cookies survive.
        // 7 days = typical Supabase session duration; the PKCE code_verifier
        // only needs to survive the ~1h magic link window, but 7d is harmless.
        maxAge: 60 * 60 * 24 * 7,
      },
    }
  )
}
