'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PROTOCOL_LABELS } from '@/lib/program'
import type { Profile, ProtocolFlags } from '@/lib/types'

export default function AdminCursantClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? '')
  const [week, setWeek] = useState(profile.week)
  const [flags, setFlags] = useState<ProtocolFlags>({ ...profile.flags })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ name: name.trim(), week, flags })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Editare profil cursant</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nume</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Nume cursant" />
          </div>
          <div>
            <label className="label">Săptămâna (1–24)</label>
            <input type="number" min={1} max={24} className="input" value={week} onChange={e => setWeek(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">Protocoale personalizate</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(Object.keys(flags) as (keyof ProtocolFlags)[]).map(key => (
              <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${flags[key] ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={() => setFlags(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-sm font-medium text-gray-700">{PROTOCOL_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Se salvează...' : saved ? 'Salvat ✓' : 'Salvează modificările'}
        </button>
      </form>
    </div>
  )
}
