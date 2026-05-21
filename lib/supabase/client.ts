'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Persistent cookies survive browser restarts on iOS Safari and Android.
        // 30 days gives users a smooth "stay logged in" experience without
        // requiring a new magic link on every device restart.
        maxAge: 60 * 60 * 24 * 30,
      },
    }
  )
}
