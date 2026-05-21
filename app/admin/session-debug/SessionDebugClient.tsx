'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DebugInfo {
  clientHasSession: boolean
  sessionExpiresAt: string | null
  sessionError: string | null
  clientCookieKeys: string[]
  supabaseCookieKeys: string[]
  cookiesEnabled: boolean
  isStandalone: boolean
  displayMode: string
  onLine: boolean
  platform: string
  userAgent: string
}

export default function SessionDebugClient() {
  const [info, setInfo] = useState<DebugInfo | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session }, error: sessErr } = await supabase.auth.getSession()

        const cookieKeys = document.cookie
          .split(';')
          .map(c => c.trim().split('=')[0])
          .filter(Boolean)
          .sort()
        const supabaseKeys = cookieKeys.filter(k => k.startsWith('sb-') || k.includes('supabase'))

        const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
        const isStandaloneNav = (window.navigator as unknown as { standalone?: boolean }).standalone === true

        setInfo({
          clientHasSession: !!session,
          sessionExpiresAt: session?.expires_at
            ? new Date(session.expires_at * 1000).toLocaleString('ro-RO')
            : null,
          sessionError: sessErr?.message ?? null,
          clientCookieKeys: cookieKeys,
          supabaseCookieKeys: supabaseKeys,
          cookiesEnabled: navigator.cookieEnabled,
          isStandalone: isStandaloneMedia || isStandaloneNav,
          displayMode: isStandaloneMedia || isStandaloneNav ? 'standalone (PWA)' :
            window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser tab',
          onLine: navigator.onLine,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        })
      } catch (e) {
        setClientError(String(e))
      }
    }
    load()
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client-side (browser)</h2>
      {clientError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{clientError}</p>
      )}
      {!info ? (
        <p className="text-sm text-gray-400 animate-pulse">Se încarcă info browser...</p>
      ) : (
        <dl className="space-y-2.5 text-sm">
          <Row label="Are sesiune client" value={info.clientHasSession ? '✅ da' : '❌ nu'} highlight={!info.clientHasSession} />
          <Row label="Sesiune expiră" value={info.sessionExpiresAt ?? '—'} />
          <Row label="Eroare sesiune" value={info.sessionError ?? '—'} highlight={!!info.sessionError} />
          <Row label="Cookies activate" value={info.cookiesEnabled ? '✅ da' : '❌ nu'} highlight={!info.cookiesEnabled} />
          <Row label="Mod afișare" value={info.displayMode} highlight={info.isStandalone} />
          <Row label="PWA standalone" value={info.isStandalone ? '✅ da' : '❌ nu (browser)'}  />
          <Row label="Online" value={info.onLine ? '✅ da' : '⚠️ offline'} />
          <Row label="Platform" value={info.platform} />
          <Row label="Cookie keys (browser)" value={info.clientCookieKeys.join(', ') || '— niciun cookie'} mono small />
          <Row label="Supabase cookies" value={info.supabaseCookieKeys.join(', ') || '❌ niciun cookie Supabase'} highlight={info.supabaseCookieKeys.length === 0} />
          <Row label="User agent" value={info.userAgent} mono small />
        </dl>
      )}
    </div>
  )
}

function Row({
  label, value, highlight, mono, small,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
  small?: boolean
}) {
  return (
    <div className="flex gap-3 items-start">
      <dt className="text-gray-500 flex-shrink-0 w-44 text-xs pt-0.5">{label}</dt>
      <dd className={`break-all ${highlight ? 'text-red-600 font-semibold' : 'text-gray-900'} ${mono ? 'font-mono' : ''} ${small ? 'text-xs text-gray-500' : 'text-sm'}`}>
        {value}
      </dd>
    </div>
  )
}
