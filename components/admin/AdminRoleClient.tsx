'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

interface Props {
  admins: Pick<Profile, 'id' | 'name' | 'email'>[]
  myId: string
}

export default function AdminRoleClient({ admins, myId }: Props) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  async function callSetRole(payload: { email?: string; userId?: string; role: string }) {
    setLoading(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/admin/set-role', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string }
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Eroare.'); return false }
    return true
  }

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    const ok = await callSetRole({ email: email.trim(), role: 'admin' })
    if (ok) { setSuccess(`${email.trim()} a fost promovat admin.`); setEmail(''); router.refresh() }
  }

  async function handleDemote(userId: string, name: string) {
    if (!window.confirm(`Retrogradează "${name}" din admin în cursant?`)) return
    const ok = await callSetRole({ userId, role: 'cursant' })
    if (ok) { setSuccess(`${name} a fost retrogradat în cursant.`); router.refresh() }
  }

  return (
    <div className="space-y-6">

      {/* Promote form */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Adaugă administrator</h3>
        <p className="text-sm text-gray-500 mb-4">
          Utilizatorul trebuie să existe deja în aplicație (să se fi autentificat cel puțin o dată).
        </p>
        <form onSubmit={handlePromote} className="flex gap-3 flex-wrap">
          <input
            type="email"
            className="input flex-1 min-w-[220px] text-sm"
            placeholder="email@exemplu.ro"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="btn-primary text-sm" disabled={loading}>
            {loading ? 'Se procesează...' : 'Promovează admin'}
          </button>
        </form>
        {error   && <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 mt-3 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
      </div>

      {/* Admins list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Administratori activi ({admins.length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {admins.map(a => (
            <div key={a.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">{a.name || '—'}</p>
                <p className="text-sm text-gray-400">{a.email}</p>
              </div>
              {a.id === myId ? (
                <span className="badge bg-brand-100 text-brand-700 text-xs">Contul tău</span>
              ) : (
                <button
                  onClick={() => handleDemote(a.id, a.name ?? a.email)}
                  disabled={loading}
                  className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Retrogradează
                </button>
              )}
            </div>
          ))}
          {admins.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Niciun administrator găsit.</p>
          )}
        </div>
      </div>

    </div>
  )
}
