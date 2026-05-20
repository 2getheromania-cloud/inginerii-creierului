import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Returns a full HTML page with debug info — visible directly on iPhone
// without needing Safari DevTools or Vercel log access.
function debugPage(
  title: string,
  message: string,
  debug: Record<string, unknown>,
): NextResponse {
  const json = JSON.stringify(debug, null, 2)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auth Debug</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,system-ui,sans-serif;background:#f9fafb;padding:16px}
    .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    h1{font-size:1.1rem;color:#dc2626;margin-bottom:8px}
    .err{background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px;color:#b91c1c;font-size:.875rem;word-break:break-all}
    h2{font-size:.7rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 6px}
    pre{background:#f3f4f6;border-radius:8px;padding:10px;font-size:.68rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all;line-height:1.6}
    a{display:block;background:#2563eb;color:#fff;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-size:.875rem;font-weight:500;margin-top:8px}
  </style>
</head>
<body>
  <div class="card">
    <h1>&#10060; ${title}</h1>
    <div class="err">${message}</div>
  </div>
  <div class="card">
    <h2>Debug log &mdash; trimite-l autorului aplicației</h2>
    <pre>${json}</pre>
  </div>
  <a href="/">&#8592; Solicită un link nou</a>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const ts = new Date().toISOString()

  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const errorParam = searchParams.get('error')
  const errorDesc  = searchParams.get('error_description')
  const next       = searchParams.get('next') ?? '/dashboard'

  // Inspect all cookies present in this request
  const cookieStore = cookies()
  const allCookies  = cookieStore.getAll()
  const cookieNames = allCookies.map(c => c.name)
  const hasVerifier = cookieNames.some(n => n.includes('code-verifier'))

  // Build a debug snapshot we'll attach to any error page
  const debug: Record<string, unknown> = {
    ts,
    requestUrl: request.url,
    params: {
      code:       code       ? `${code.slice(0, 10)}…`       : null,
      token_hash: token_hash ? `${token_hash.slice(0, 10)}…` : null,
      type:       type       ?? null,
      error:      errorParam ?? null,
      error_desc: errorDesc  ?? null,
    },
    cookies: {
      totalCount:     allCookies.length,
      names:          cookieNames,
      hasCodeVerifier: hasVerifier,
    },
  }

  console.log('[auth/callback] request', JSON.stringify(debug))

  // ── 1. Supabase-generated errors in the URL (e.g. expired link on server) ──
  if (errorParam) {
    const msg = errorDesc ?? errorParam
    console.error('[auth/callback] URL error param:', msg)
    debug.step = 'url-error-param'
    return debugPage('Eroare din Supabase', msg, debug)
  }

  // ── 2. Neither code nor token_hash ──
  if (!code && !token_hash) {
    console.error('[auth/callback] no code or token_hash in URL')
    debug.step = 'missing-params'
    return debugPage('Link invalid', 'URL-ul nu conține nici code, nici token_hash.', debug)
  }

  // ── 3. Create server client ──
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

  // ── 4. Exchange / verify — exactly once ──
  let authError: { message: string; status?: number } | null = null

  if (code) {
    debug.step = 'exchangeCodeForSession'
    console.log('[auth/callback] calling exchangeCodeForSession — hasVerifier:', hasVerifier)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
      ? { message: error.message, status: (error as { status?: number }).status }
      : null
    debug.exchangeResult = authError ? { ok: false, ...authError } : { ok: true }
    console.log('[auth/callback] exchangeCodeForSession result:', JSON.stringify(debug.exchangeResult))
  } else if (token_hash && type) {
    debug.step = 'verifyOtp'
    console.log('[auth/callback] calling verifyOtp — type:', type)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    authError = error
      ? { message: error.message, status: (error as { status?: number }).status }
      : null
    debug.verifyResult = authError ? { ok: false, ...authError } : { ok: true }
    console.log('[auth/callback] verifyOtp result:', JSON.stringify(debug.verifyResult))
  }

  // ── 5. Fallback: if PKCE failed but a token_hash is also present, try verifyOtp ──
  if (authError && code && token_hash && type) {
    debug.step = 'verifyOtp-fallback'
    console.log('[auth/callback] PKCE failed — trying verifyOtp fallback')
    const { error: fbErr } = await supabase.auth.verifyOtp({ token_hash, type })
    debug.fallbackResult = fbErr
      ? { ok: false, message: fbErr.message }
      : { ok: true }
    console.log('[auth/callback] fallback result:', JSON.stringify(debug.fallbackResult))
    if (!fbErr) authError = null
  }

  // ── 6. Show debug page on any remaining error ──
  if (authError) {
    debug.finalError = authError
    console.error('[auth/callback] FINAL ERROR:', JSON.stringify(authError))
    const display = authError.message.includes('expired')
      ? 'Link-ul a expirat. Solicită un link nou.'
      : authError.message
    return debugPage('Autentificare eșuată', display, debug)
  }

  // ── 7. Verify user exists in session ──
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    debug.step = 'no-user-after-exchange'
    console.error('[auth/callback] exchange ok but getUser() returned null')
    return debugPage('Sesiune invalidă', 'Exchange reușit, dar getUser() nu a returnat utilizatorul.', debug)
  }

  debug.userId = user.id

  // ── 8. Role-based redirect ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const dest = profile?.role === 'admin' ? '/admin' : next
  console.log('[auth/callback] SUCCESS — redirecting to', dest, 'userId:', user.id)
  return NextResponse.redirect(`${origin}${dest}`)
}
