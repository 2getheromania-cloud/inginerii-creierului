// Minimal service worker for PWA installability
// Network-first strategy — no aggressive caching to avoid stale Next.js builds

const CACHE = 'ic-v6'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
)

// Push notification — updates badge and shows system notification
self.addEventListener('push', e => {
  if (!e.data) return
  let data = {}
  try { data = e.data.json() } catch { return }

  const title = data.title || 'Inginerii Creierului'
  const body  = data.body  || 'Mesaj nou'
  const badge = data.badge || 1
  const url   = data.url   || '/mesaje'

  e.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon:     '/icon-192.png',
        badge:    '/icon-192.png',
        tag:      'private-message',
        renotify: true,
        data:     { url },
      }),
      self.navigator.setAppBadge
        ? self.navigator.setAppBadge(badge).catch(() => {})
        : Promise.resolve(),
    ])
  )
})

// Open the app (or focus existing window) when notification is tapped
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/mesaje'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus() }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// Badge API — called from the page via postMessage (more reliable on iOS)
self.addEventListener('message', e => {
  if (e.data?.type === 'SET_BADGE') {
    const count = e.data.count ?? 0
    if (count > 0) {
      self.navigator.setAppBadge(count).catch(() => {})
    } else {
      self.navigator.clearAppBadge().catch(() => {})
    }
  }
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Never intercept: API routes, auth, Supabase, cross-origin
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) return

  // Navigation: network first, fallback to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  // Static assets: cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(svg|png|ico|webp|woff2?)$/)
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        })
      })
    )
  }
})
