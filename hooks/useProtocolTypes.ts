'use client'
import { useState, useEffect } from 'react'
import type { ProtocolType } from '@/lib/types'

export function useProtocolTypes() {
  const [data, setData]       = useState<ProtocolType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/protocol-types')
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? 'Eroare')))
      .then((d: ProtocolType[]) => setData(d))
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
