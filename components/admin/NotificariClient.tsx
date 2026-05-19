'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { Profile, Notification } from '@/lib/types'

const TEMPLATES = [
  { label: 'Reminder checklist', subject: 'Reminder: completează raportul zilnic', body: 'Bună ziua!\n\nNu am văzut raportul tău de azi. Te invit să-ți iei 2 minute pentru a-l completa.\n\nEchipa Inginerii Creierului' },
  { label: 'Felicitări progres',  subject: 'Felicitări pentru progresul tău!', body: 'Bună ziua!\n\nVreau să te felicit pentru dedicarea ta în program. Continuă tot așa!\n\nEchipa Inginerii Creierului' },
  { label: 'Schimbare fază',      subject: 'Ai trecut la o nouă fază!', body: 'Bună ziua!\n\nFelicitări! Ai trecut la o nouă fază a programului. Materialele noi sunt disponibile în secțiunea Resurse.\n\nEchipa Inginerii Creierului' },
]

interface Props {
  cursanti: Pick<Profile, 'id' | 'name' | 'email'>[]
  recentNotifications: Notification[]
}

export default function NotificariClient({ cursanti, recentNotifications }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [scheduleFor, setScheduleFor] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function toggleCursant(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAll() {
    setSelectedIds(selectedIds.length === cursanti.length ? [] : cursanti.map(c => c.id))
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setSubject(t.subject)
    setMessage(t.body)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0 || !subject.trim() || !message.trim()) return
    setSending(true)
    setResult(null)

    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selectedIds, subject, message, scheduleFor: scheduleFor || null }),
    })
    const json = await res.json()
    setSending(false)
    if (res.ok) {
      setResult({ ok: true, msg: `Trimis cu succes la ${selectedIds.length} cursant(ți).` })
      setSelectedIds([])
      setSubject('')
      setMessage('')
      setScheduleFor('')
    } else {
      setResult({ ok: false, msg: json.error ?? 'Eroare la trimitere.' })
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Formular */}
      <div className="space-y-6">
        {/* Selectare cursanți */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Destinatari</h2>
            <button onClick={selectAll} className="text-xs text-brand-600 hover:underline">
              {selectedIds.length === cursanti.length ? 'Deselectează toți' : 'Selectează toți'}
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {cursanti.map(c => (
              <label key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(c.id) ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleCursant(c.id)}
                  className="w-4 h-4 accent-brand-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name || c.email}</p>
                  {c.name && <p className="text-xs text-gray-400">{c.email}</p>}
                </div>
              </label>
            ))}
            {cursanti.length === 0 && <p className="text-sm text-gray-400 p-2">Niciun cursant.</p>}
          </div>
          <p className="text-xs text-gray-400 mt-2">{selectedIds.length} selectat(ți)</p>
        </div>

        {/* Template-uri */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Template-uri rapide</h2>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => applyTemplate(t)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formular mesaj */}
        <form onSubmit={handleSend} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Compune mesajul</h2>
          <div>
            <label className="label">Subiect</label>
            <input
              type="text"
              className="input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subiectul emailului..."
              required
            />
          </div>
          <div>
            <label className="label">Mesaj</label>
            <textarea
              className="input min-h-32 resize-y"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Textul mesajului..."
              required
            />
          </div>
          <div>
            <label className="label">Programează pentru (opțional)</label>
            <input
              type="datetime-local"
              className="input"
              value={scheduleFor}
              onChange={e => setScheduleFor(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Lasă gol pentru trimitere imediată.</p>
          </div>

          {result && (
            <p className={`text-sm rounded-lg px-3 py-2 ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {result.msg}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={sending || selectedIds.length === 0}
          >
            {sending ? 'Se trimite...' : scheduleFor ? 'Programează' : 'Trimite acum'}
          </button>
        </form>
      </div>

      {/* Notificări recente */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Notificări recente</h2>
        {recentNotifications.length === 0 ? (
          <p className="text-sm text-gray-400">Niciun istoric.</p>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((n: Notification) => (
              <div key={n.id} className="border-l-2 border-brand-200 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge text-xs ${
                    n.type === 'manual' ? 'bg-blue-100 text-blue-700' :
                    n.type === 'daily_reminder' ? 'bg-green-100 text-green-700' :
                    n.type === 'inactivity_alert' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {n.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(n.sent_at)}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
