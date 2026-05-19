'use client'
import { useState } from 'react'
import type { Profile } from '@/lib/types'

interface Props {
  cursanti: Pick<Profile, 'id' | 'name' | 'email'>[]
}

export default function RapoarteClient({ cursanti }: Props) {
  const [userId, setUserId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const params = new URLSearchParams()
    if (userId !== 'all') params.set('userId', userId)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo)   params.set('to',   dateTo)

    const res = await fetch(`/api/reports/export?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapoarte_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Configurare export CSV</h2>

        <div>
          <label className="label">Cursant</label>
          <select className="input" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="all">Toți cursanții</option>
            {cursanti.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.email}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data de la</label>
            <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Data până la</label>
            <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Se generează...' : 'Descarcă CSV'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Ce conține exportul</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            'Data raportului',
            'Numele cursantului',
            'Email',
            'Săptămâna',
            'Completare checklist (%)',
            'Indicatori (energie, somn, stres, stare, productivitate)',
            'Pași, apă totală',
            'Mișcare, meditație',
            'Simptome',
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-brand-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-4">
          Fișierul CSV este compatibil cu Excel și Google Sheets.
        </p>
      </div>
    </div>
  )
}
