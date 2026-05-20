'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LogEntry { ts: string; msg: string; data?: Record<string, unknown> }

export default function AuthConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = useRef(false)
  const [phase, setPhase]     = useState<'loading' | 'error'>('loading')
  const [errorText, setError] = useState('')
  const [logs, setLogs]       = useState<LogEntry[]>([])

  function log(msg: string, data?: Record<string, unknown>) {
    console.log('[auth/confirm]', msg, data ?? '')
    setLogs(prev => [...prev, { ts: new Date().toISOString().slice(11, 23), msg, data }])
  }

  useEffect(() => {
    if (done.current) return
    done.current = true

    const code      = searchParams.get('code')
    const th        = searchParams.get('token_hash')
    const type      = searchParams.get('type')
    const errParam  = searchParams.get('error')
    const errDesc   = searchParams.get('error_description')

    log('URL params', {
      code:       code ? `${code.slice(0, 8)}…` : '—',
      token_hash: th   ? `${th.slice(0, 8)}…`   : '—',
      type:       type    ?? '—',
      error:      errParam ?? '—',
      error_desc: errDesc  ?? '—',
    })

    if (errParam) {
      const msg = errDesc ?? errParam
      log('URL error → aborting', { msg })
      setError(msg)
      setPhase('error')
      return
    }

    if (!code && !th) {
      log('ABORT: no code / token_hash in URL')
      setError('Link invalid — nu conține cod de autentificare.')
      setPhase('error')
      return
    }

    // createBrowserClient sets detectSessionInUrl: true — it auto-calls
    // exchangeCodeForSession internally. We subscribe to onAuthStateChange
    // instead of calling it manually (calling it twice consumes the one-time code).
    const supabase = createClient()
    log('Supabase client created')

    let resolved = false

    async function doRedirect(userId: string) {
      if (resolved) return
      resolved = true
      log('Session OK → fetching role', { userId })

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileErr) log('Profile fetch error', { error: profileErr.message })
      const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
      log('Redirecting', { dest, role: profile?.role ?? 'null' })
      router.replace(dest)
    }

    function doFail(reason: string, supabaseMsg?: string) {
      if (resolved) return
      resolved = true
      sub.unsubscribe()
      clearTimeout(timer)
      log('FAILED', { reason, supabaseMsg: supabaseMsg ?? '—' })
      const display = supabaseMsg
        ? `Eroare Supabase: ${supabaseMsg}`
        : reason.toLowerCase().includes('expired')
        ? 'Link-ul a expirat. Solicită un link nou.'
        : `Autentificare eșuată: ${reason}`
      setError(display)
      setPhase('error')
    }

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log('onAuthStateChange', {
          event,
          user:      session?.user?.id  ?? 'null',
          expiresAt: session?.expires_at ?? 'null',
        })
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          sub.unsubscribe()
          clearTimeout(timer)
          doRedirect(session.user.id)
        }
      }
    )

    // getSession covers the race where SIGNED_IN fired before we subscribed
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      log('getSession', {
        user:      session?.user?.id  ?? 'null',
        error:     error?.message     ?? 'null',
        expiresAt: session?.expires_at ?? 'null',
      })
      if (session?.user) doRedirect(session.user.id)
      else if (error)    doFail(error.message, error.message)
    })

    // 12 s fallback — fires if auto-detection fails silently (e.g. no code_verifier)
    const timer = setTimeout(() => doFail('timeout — 12s fără sesiune'), 12000)

    return () => { sub.unsubscribe(); clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function LogPanel() {
    return (
      <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left overflow-auto max-h-52 space-y-0.5">
        {logs.length === 0
          ? <p className="text-xs text-gray-400 font-mono">Așteptând...</p>
          : logs.map((e, i) => (
              <div key={i} className="text-xs font-mono leading-relaxed break-all">
                <span className="text-gray-400 select-none">{e.ts} </span>
                <span className="text-gray-800 font-semibold">{e.msg}</span>
                {e.data && <span className="text-gray-500"> {JSON.stringify(e.data)}</span>}
              </div>
            ))
        }
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
        <div className="card max-w-sm w-full">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">❌</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Autentificare eșuată</h2>
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">
              {errorText}
            </p>
          </div>
          <a href="/" className="btn-primary w-full text-center block">
            Solicită un link nou →
          </a>
          <p className="text-xs text-gray-500 font-semibold mt-5">Debug log:</p>
          <LogPanel />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Se autentifică...</h2>
        <p className="text-gray-500 text-sm">Te rugăm să aștepți câteva secunde.</p>
        <LogPanel />
      </div>
    </div>
  )
}
