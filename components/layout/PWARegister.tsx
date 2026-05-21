'use client'
import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Snapshot before registration — if a controller existed before, it's an update
    const hadController = !!navigator.serviceWorker.controller

    // When a new SW takes control, reload once to load fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) window.location.reload()
    })

    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  return null
}
