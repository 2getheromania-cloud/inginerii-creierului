'use client'
import { useState, useEffect } from 'react'

export default function BrowserNotifCard() {
  const [permission, setPermission] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        new Notification('Inginerii Creierului', {
          body: 'Notificările sunt activate! Vei fi alertat când primești mesaje noi.',
          icon: '/favicon.ico',
        })
      }
    } catch {
      setPermission('denied')
    } finally {
      setLoading(false)
    }
  }

  // Only show when browser supports notifications and permission hasn't been decided yet
  if (permission !== 'default') return null

  return (
    <div className="card flex items-center gap-4 bg-brand-50 border-brand-100">
      <div className="text-2xl flex-shrink-0">🔔</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">Activează notificările</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Primești alertă în browser când ai mesaje noi, chiar și cu alt tab activ.
        </p>
      </div>
      <button
        onClick={requestPermission}
        disabled={loading}
        className="btn-primary text-sm py-1.5 px-3 flex-shrink-0 disabled:opacity-60"
      >
        {loading ? 'Se activează...' : 'Activează'}
      </button>
    </div>
  )
}
