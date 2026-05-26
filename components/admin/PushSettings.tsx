'use client'
import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf.buffer
}

export default function PushSettings() {
  const [perm, setPerm] = useState<string>('necunoscut')
  const [hasSub, setHasSub] = useState<boolean | null>(null)
  const [inDb, setInDb] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof Notification === 'undefined') { setSupported(false); setPerm('indisponibil'); return }
    setPerm(Notification.permission)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setSupported(false); return }
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setHasSub(!!sub)
      if (sub) {
        const res = await fetch(`/api/push/check?endpoint=${encodeURIComponent(sub.endpoint)}`).catch(() => null)
        const d = await res?.json().catch(() => ({})) as { found?: boolean }
        setInDb(d.found ?? false)
      } else {
        setInDb(false)
      }
    }).catch(() => setSupported(false))
  }, [])

  async function handleActivate() {
    setMsg(null)
    setLoading(true)
    try {
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setMsg('Push nu este suportat pe acest browser.')
        return
      }
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
        setPerm(perm)
      }
      if (perm !== 'granted') {
        setMsg('Permisiunea pentru notificări a fost refuzată. Activează-o manual din setările browserului/iOS.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const stale = await reg.pushManager.getSubscription()
      if (stale) await stale.unsubscribe().catch(() => {})

      const kvRes = await fetch('/api/push/vapid-key')
      if (!kvRes.ok) throw new Error(`VAPID_FETCH_${kvRes.status}`)
      const { key } = await kvRes.json() as { key?: string }
      if (!key) throw new Error('VAPID_KEY_EMPTY')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!saveRes.ok) throw new Error('Salvare eșuată')

      setHasSub(true)
      setInDb(true)
      setPerm('granted')
      setMsg('Notificările push sunt active!')
    } catch (e) {
      setMsg(`Eroare: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = inDb ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
  const statusText = !supported
    ? 'Browserul/aplicația nu suportă push notifications. Folosește aplicația instalată (PWA) pe iOS/Android.'
    : perm === 'denied'
    ? 'Permisiunea a fost refuzată. Mergi la Setări → Safari/Chrome → Notificări și activează manual.'
    : inDb
    ? 'Activ — vei primi notificări push.'
    : hasSub === false
    ? 'Neactivat — apasă butonul de mai jos.'
    : 'Subscripție expirată — apasă butonul de mai jos pentru reactivare.'

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border px-4 py-3 text-sm ${statusColor}`}>
        <p className="font-semibold mb-1">
          Stare: {inDb ? '✓ Activ' : '✗ Inactiv'}
        </p>
        <p>{statusText}</p>
        {supported && perm !== 'denied' && (
          <p className="text-xs mt-1 opacity-70">
            Permisiune browser: {perm} · Subscripție browser: {hasSub === null ? '...' : hasSub ? 'da' : 'nu'} · Înregistrat în DB: {inDb === null ? '...' : inDb ? 'da' : 'nu'}
          </p>
        )}
      </div>

      {supported && perm !== 'denied' && (
        <button
          onClick={handleActivate}
          disabled={loading || inDb === true}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Se activează...' : inDb ? 'Deja activ' : 'Activează notificările push'}
        </button>
      )}

      {msg && (
        <p className={`text-sm ${msg.includes('Eroare') || msg.includes('refuzată') ? 'text-red-600' : 'text-green-700'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
