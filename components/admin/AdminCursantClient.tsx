'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import ProtocolMultiSelect from './ProtocolMultiSelect'

export default function AdminCursantClient({ profile }: { profile: Profile }) {
  const [name,          setName]          = useState(profile.name ?? '')
  const [week,          setWeek]          = useState(profile.week)
  const [protocols,     setProtocols]     = useState<string[]>(profile.protocols ?? [])
  const [appStartDate,  setAppStartDate]  = useState(profile.app_start_date ?? '')
  const [allowBackfill, setAllowBackfill] = useState(profile.allow_backfill ?? false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const supabase  = createClient()
  const router    = useRouter()

  // Reset saved banner when server refreshes the profile prop after router.refresh()
  useEffect(() => { setSaved(false) }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        week,
        protocols,
        app_start_date: appStartDate || null,
        allow_backfill: allowBackfill,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => { router.refresh() }, 1000)
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Editare profil cursant</h3>
      <form onSubmit={handleSave} className="space-y-5">

        {/* Name + week */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nume</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Nume cursant" />
          </div>
          <div>
            <label className="label">Săptămâna curentă (1–24)</label>
            <input type="number" min={1} max={24} className="input" value={week}
              onChange={e => setWeek(Number(e.target.value))} />
            <p className="text-xs text-gray-400 mt-1">Controlează faza, rețetele și resursele.</p>
          </div>
        </div>

        {/* App start date + backfill */}
        <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div>
            <label className="label">Data de start monitorizare</label>
            <input
              type="date"
              className="input"
              value={appStartDate}
              max={todayISO()}
              onChange={e => { setAppStartDate(e.target.value); setSaved(false) }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Streak-ul și statisticile se calculează de la această dată.
              Zilele anterioare nu apar ca lipsă.
            </p>
          </div>
          <div>
            <label className="label">Completare retroactivă</label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors mt-1 ${
              allowBackfill ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={allowBackfill}
                onChange={() => { setAllowBackfill(v => !v); setSaved(false) }}
                className="w-4 h-4 accent-brand-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Allow backfill</p>
                <p className="text-xs text-gray-400">Cursantul poate completa zile trecute</p>
              </div>
            </label>
          </div>
        </div>

        {/* Protocols */}
        <div>
          <label className="label">Protocoale personalizate</label>
          <div className="mt-1">
            <ProtocolMultiSelect
              value={protocols}
              onChange={v => { setProtocols(v); setSaved(false) }}
              disabled={saving}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        {saved && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 font-medium">
            ✓ Profil actualizat cu succes — pagina se reîncarcă...
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving || saved}>
          {saving ? 'Se salvează...' : 'Salvează modificările'}
        </button>
      </form>
    </div>
  )
}
