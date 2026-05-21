'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const CURSANT_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat',      label: 'Comunitate' },
  { href: '/mesaje',    label: 'Mesaje' },
  { href: '/biblioteca', label: 'Bibliotecă' },
  { href: '/documente', label: 'Documente' },
  { href: '/istoric',   label: 'Istoric' },
  { href: '/resurse',   label: 'Resurse' },
  { href: '/profil',    label: 'Profil' },
]

const ADMIN_NAV = [
  { href: '/admin',              label: 'Cursanți' },
  { href: '/chat',               label: 'Comunitate' },
  { href: '/mesaje',             label: 'Mesaje' },
  { href: '/biblioteca',         label: 'Bibliotecă' },
  { href: '/documente',          label: 'Documente' },
  { href: '/admin/notificari',   label: 'Notificări' },
  { href: '/admin/rapoarte',     label: 'Rapoarte' },
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

// Single toast bubble with slide-in animation
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
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const nav = isAdmin ? ADMIN_NAV : CURSANT_NAV

  const [unreadPrivate, setUnreadPrivate]     = useState(0)
  const [unreadCommunity, setUnreadCommunity] = useState(0)
  const [toasts, setToasts]                   = useState<ToastItem[]>([])

  // Mutable tracking refs — don't need to trigger re-renders
  const stateRef = useRef({
    pathname,
    lastToastedPrivateId:    null as string | null,
    lastToastedCommunityId:  null as string | null,
  })
  useEffect(() => { stateRef.current.pathname = pathname }, [pathname])

  // Stable toast adder (only depends on setToasts which is stable)
  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev.slice(-2), { ...t, id }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  // Fetch + process unread counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-counts')
      if (!res.ok) return
      const data: UnreadData = await res.json()
      const { pathname: path, lastToastedPrivateId, lastToastedCommunityId } = stateRef.current

      // ── Private: toast + browser notification ──────────────────────────────
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

      // ── Community: in-app toast always; browser only for admin/announcement ─
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
      // When already on /chat, always show 0 (mark-community-read is called separately)
      setUnreadCommunity(path.startsWith('/chat') ? 0 : data.communityCount)
    } catch {}
  }, [addToast])

  // Poll every 10s
  useEffect(() => {
    fetchCounts()
    const id = setInterval(fetchCounts, 10_000)
    return () => clearInterval(id)
  }, [fetchCounts])

  // When navigating to /chat: zero badge immediately + write last_seen to DB
  useEffect(() => {
    if (pathname.startsWith('/chat')) {
      setUnreadCommunity(0)
      fetch('/api/notifications/mark-community-read', { method: 'POST' }).catch(() => {})
    }
  }, [pathname])

  // Presence ping
  useEffect(() => {
    const ping = () => fetch('/api/presence', { method: 'PUT' }).catch(() => {})
    ping()
    const id = setInterval(ping, 30_000)
    return () => clearInterval(id)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo + nav links */}
          <div className="flex items-center gap-6">
            <Link
              href={isAdmin ? '/admin' : '/dashboard'}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                IC
              </div>
              <span className="font-semibold text-gray-900 hidden sm:inline">
                Inginerii Creierului
              </span>
            </Link>

            <div className="flex items-center gap-1">
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
                      'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {label}
                    {badge > 0 && (
                      <span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 inline-flex items-center justify-center px-1 leading-none pointer-events-none"
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

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="badge bg-purple-100 text-purple-700">Admin</span>
            )}
            <span className="text-sm text-gray-600 hidden md:inline">
              {profile.name || profile.email}
            </span>
            <button onClick={signOut} className="btn-secondary text-sm py-1.5 px-3">
              Ieși
            </button>
          </div>
        </div>
      </nav>

      {/* Toast container — fixed, top-right, above navbar */}
      <div
        className="fixed top-[60px] right-3 z-[200] flex flex-col gap-2 pointer-events-none"
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

// Fire a browser notification if permission is granted
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
