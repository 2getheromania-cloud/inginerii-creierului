'use client'
import { useState, useEffect } from 'react'
import type { ProtocolType } from '@/lib/types'

export default function ProtocolTypesManager() {
  const [items, setItems]       = useState<ProtocolType[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [newName, setNewName]   = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [adding, setAdding]     = useState(false)

  useEffect(() => {
    fetch('/api/admin/protocol-types')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setError('Eroare la încărcare.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/protocol-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), drive_url: newUrl.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Eroare.'); return }
      setItems(prev => [...prev, data as ProtocolType])
      setNewName('')
      setNewUrl('')
    } catch {
      setError('Eroare de rețea.')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleActive(item: ProtocolType) {
    const next = !item.is_active
    try {
      const res = await fetch(`/api/admin/protocol-types/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      if (res.ok) {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, is_active: next } : p))
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setError(d.error ?? 'Eroare.')
      }
    } catch {
      setError('Eroare de rețea.')
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Se încarcă...</p>

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs">ok</button>
        </div>
      )}

      {/* Add new */}
      <form onSubmit={handleAdd} className="space-y-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700">Adaugă protocol nou</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nume protocol *</label>
            <input
              type="text"
              className="input"
              placeholder="ex: SIBO, Candidoză..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Link Drive (opțional)</label>
            <input
              type="url"
              className="input"
              placeholder="https://drive.google.com/..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary text-sm" disabled={adding || !newName.trim()}>
          {adding ? 'Se adaugă...' : 'Adaugă protocol'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-gray-400">Niciun protocol definit.</p>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
              item.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                {!item.is_active && (
                  <span className="text-[10px] font-semibold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                    Inactiv
                  </span>
                )}
              </div>
              {item.drive_url && (
                <a
                  href={item.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline truncate block max-w-xs"
                >
                  {item.drive_url}
                </a>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-3">
              <button
                onClick={() => handleToggleActive(item)}
                className={`text-xs py-1 px-3 rounded-lg border transition-colors ${
                  item.is_active
                    ? 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {item.is_active ? 'Dezactivează' : 'Activează'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
