'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const CURSANT_NAV = [
  { href: '/dashboard',  label: 'Dashboard' },
  { href: '/chat',       label: 'Comunitate' },
  { href: '/mesaje',     label: 'Mesaje' },
  { href: '/intalniri',  label: 'Întâlniri' },
  { href: '/biblioteca', label: 'Bibliotecă' },
  { href: '/documente',  label: 'Documente' },
  { href: '/istoric',    label: 'Istoric' },
  { href: '/resurse',    label: 'Resurse' },
  { href: '/profil',     label: 'Profil' },
]

const ADMIN_NAV = [
  { href: '/admin',              label: 'Cursanți' },
  { href: '/chat',               label: 'Comunitate' },
  { href: '/mesaje',             label: 'Mesaje' },
  { href: '/intalniri',          label: 'Întâlniri' },
  { href: '/biblioteca',         label: 'Bibliotecă' },
  { href: '/documente',          label: 'Documente' },
  { href: '/resurse',            label: 'Resurse' },
  { href: '/admin/notificari',   label: 'Notificări' },
  { href: '/admin/rapoarte',     label: 'Rapoarte' },
  { href: '/admin/setari',       label: 'Setări' },
]

interface ToastItem {
  id: string
  title: string
  body?: string
  href: string
}

interface UnreadData {
  privateCount: number
  communityCount: number
  latestPrivate: {
    messageId: string
    senderName: string
    preview: string
    conversationId: string
  } | null
  latestCommunity: {
    messageId: string
    isAdmin: boolean
    isAnnouncement: boolean
    preview: string
  } | null
}

function ToastBubble({
  t,
  onDismiss,
  onGo,
}: {
  t: ToastItem
  onDismiss: () => void
  onGo: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 bg-white shadow-lg border border-gray-100',
        'rounded-2xl px-4 py-3 w-64 sm:w-72 transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
      )}
    >
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onGo}>
        <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
        {t.body && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.body}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
        aria-label="Închide notificarea"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function Navbar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const isAdmin  = profile.role === 'admin'
  const nav      = isAdmin ? ADMIN_NAV : CURSANT_NAV

  const [unreadPrivate, setUnreadPrivate]     = useState(0)
  const [unreadCommunity, setUnreadCommunity] = useState(0)
  const [toasts, setToasts]                   = useState<ToastItem[]>([])
  const [notifPerm, setNotifPerm]             = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission)
  }, [])

  const stateRef = useRef({
    pathname,
    lastToastedPrivateId:   null as string | null,
    lastToastedCommunityId: null as string | null,
  })
  useEffect(() => { stateRef.current.pathname = pathname }, [pathname])

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev.slice(-2), { ...t, id }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-counts')
      if (!res.ok) return
      const data: UnreadData = await res.json()
      const { pathname: path, lastToastedPrivateId, lastToastedCommunityId } = stateRef.current

      if (
        data.latestPrivate &&
        data.latestPrivate.messageId !== lastToastedPrivateId &&
        data.privateCount > 0 &&
        !path.startsWith('/mesaje')
      ) {
        const { senderName, preview, messageId } = data.latestPrivate
        addToast({ title: senderName, body: preview || undefined, href: '/mesaje' })
        stateRef.current.lastToastedPrivateId = messageId
        browserNotify(senderName, preview || 'Mesaj nou', messageId)
      }

      if (
        data.latestCommunity &&
        data.latestCommunity.messageId !== lastToastedCommunityId &&
        data.communityCount > 0 &&
        !path.startsWith('/chat')
      ) {
        const { messageId, isAdmin: fromAdmin, isAnnouncement, preview } = data.latestCommunity
        addToast({
          title: 'Mesaj nou în Comunitate',
          body: (fromAdmin || isAnnouncement) ? preview || undefined : undefined,
          href: '/chat',
        })
        stateRef.current.lastToastedCommunityId = messageId
        if (fromAdmin || isAnnouncement) {
          browserNotify('Comunitate — Inginerii Creierului', preview || 'Mesaj nou de la admin', messageId)
        }
      }

      setUnreadPrivate(data.privateCount)
      setUnreadCommunity(path.startsWith('/chat') ? 0 : data.communityCount)
    } catch {}
  }, [addToast])

  useEffect(() => {
    fetchCounts()
    const id = setInterval(fetchCounts, 10_000)
    return () => clearInterval(id)
  }, [fetchCounts])

  useEffect(() => {
    if (pathname.startsWith('/chat')) {
      setUnreadCommunity(0)
      fetch('/api/notifications/mark-community-read', { method: 'POST' }).catch(() => {})
    }
  }, [pathname])

  useEffect(() => {
    const total = unreadPrivate + unreadCommunity
    if ('setAppBadge' in navigator) {
      if (total > 0) navigator.setAppBadge(total).catch(() => {})
      else navigator.clearAppBadge().catch(() => {})
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(reg => {
          const sw = reg.active ?? reg.waiting ?? reg.installing
          sw?.postMessage({ type: 'SET_BADGE', count: total })
        })
        .catch(() => {})
    }
  }, [unreadPrivate, unreadCommunity])

  async function subscribePush(reg: ServiceWorkerRegistration) {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
    } catch {}
  }

  async function requestNotifPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setNotifPerm(result)
    if (result === 'granted') {
      const total = unreadPrivate + unreadCommunity
      if ('setAppBadge' in navigator) {
        if (total > 0) navigator.setAppBadge(total).catch(() => {})
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(async reg => {
            const sw = reg.active ?? reg.waiting ?? reg.installing
            sw?.postMessage({ type: 'SET_BADGE', count: total })
            await subscribePush(reg)
          })
          .catch(() => {})
      }
    }
  }

  useEffect(() => {
    const ping = () => fetch('/api/presence', { method: 'PUT' }).catch(() => {})
    ping()
    const id = setInterval(ping, 30_000)
    return () => clearInterval(id)
  }, [])

  async function signOut() {
    if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {})
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">

        {/* ── Top bar: logo + user info + sign out ───────────────────── */}
        <div className="px-4 flex items-center justify-between h-12 max-w-6xl mx-auto">
          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <img src="/icon-192.png" alt="IC" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            <span className="font-semibold text-gray-900 hidden sm:inline text-sm">
              Inginerii Creierului
            </span>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <span className="badge bg-purple-100 text-purple-700 hidden sm:inline-flex">Admin</span>
            )}
            <span className="text-xs text-gray-500 hidden md:inline max-w-[140px] truncate">
              {profile.name || profile.email}
            </span>
            <button onClick={signOut} className="btn-secondary text-xs py-1 px-2.5">
              Ieși
            </button>
          </div>
        </div>

        {/* ── Tab strip: horizontally scrollable on mobile ───────────── */}
        <div className="border-t border-gray-50 bg-white">
          <div
            className="scrollbar-none flex overflow-x-auto px-3 gap-0.5 max-w-6xl mx-auto"
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {nav.map(({ href, label }) => {
              const badge =
                href === '/mesaje' ? unreadPrivate
                : href === '/chat'  ? unreadCommunity
                : 0
              const isActive =
                pathname === href ||
                (href !== '/admin' && href !== '/dashboard' && pathname.startsWith(href))

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-lg',
                    isActive
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {label}
                  {badge > 0 && (
                    <span
                      className="absolute top-1 right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] inline-flex items-center justify-center px-1 leading-none pointer-events-none"
                      aria-label={`${badge} mesaje necitite`}
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Notification permission prompt — shown whenever permission hasn't been granted/denied */}
      {notifPerm === 'default' && (
        <div className="bg-brand-50 border-b border-brand-100 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-brand-800 flex-1">
            Activează notificările pentru a vedea cifra pe iconița aplicației.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={requestNotifPermission}
              className="text-xs font-semibold text-white bg-brand-600 rounded-lg px-3 py-1.5 hover:bg-brand-700 active:scale-95 transition-all"
            >
              Activează
            </button>
            <button
              onClick={() => setNotifPerm('denied')}
              className="text-xs text-brand-500 hover:text-brand-700 px-1"
            >
              Nu acum
            </button>
          </div>
        </div>
      )}

      {/* Toast container — positioned below the two-row navbar (~88px) */}
      <div
        className="fixed top-[92px] right-3 z-[200] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notificări"
      >
        {toasts.map(t => (
          <ToastBubble
            key={t.id}
            t={t}
            onDismiss={() => dismissToast(t.id)}
            onGo={() => { dismissToast(t.id); router.push(t.href) }}
          />
        ))}
      </div>
    </>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf.buffer
}

function browserNotify(title: string, body: string, tag: string) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) return
  try {
    new Notification(title, { body, tag, icon: '/favicon.ico' })
  } catch {}
}
