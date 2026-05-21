'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { PROTOCOL_LABELS } from '@/lib/program'
import type { Profile, ProtocolFlags } from '@/lib/types'

export default function ProfilClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? '')
  const [reminderTime, setReminderTime] = useState(profile.reminder_time ?? '18:00')
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
      .update({ name: name.trim(), reminder_time: reminderTime })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const activeFlags = Object.entries(profile.flags as ProtocolFlags)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof ProtocolFlags)

  return (
    <div className="space-y-6">
      {/* Info de bază */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Informații cont</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Nume</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Numele tău"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input bg-gray-50" value={profile.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email-ul nu poate fi modificat.</p>
          </div>
          <div>
            <label className="label">Ora reminder zilnic</label>
            <input
              type="time"
              className="input"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Vei primi un reminder dacă nu ai completat raportul până la această oră.</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Se salvează...' : saved ? 'Salvat ✓' : 'Salvează'}
          </button>
        </form>
      </div>

      {/* Status program */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Status program</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Săptămâna curentă</span>
            <span className="font-semibold text-brand-700">{profile.week}/24</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Înscris la</span>
            <span className="font-medium text-gray-800">{formatDate(profile.created_at)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">Rol</span>
            <span className="badge bg-brand-100 text-brand-700 capitalize">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Protocoale */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Protocoale personalizate</h2>
        {activeFlags.length === 0 ? (
          <p className="text-sm text-gray-400">Niciun protocol activ. Contactează adminul pentru a activa.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeFlags.map(flag => (
              <span key={flag} className="badge bg-amber-100 text-amber-800">
                {PROTOCOL_LABELS[flag]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Deconectare */}
      <button onClick={handleSignOut} className="btn-danger w-full">
        Deconectează-te
      </button>
    </div>
  )
}
