'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRAM_PHASES, PROTOCOL_LABELS } from '@/lib/program'
import type { AdminMessage, ProtocolFlags } from '@/lib/types'

const PROTOCOL_KEYS = Object.keys(PROTOCOL_LABELS) as (keyof ProtocolFlags)[]

const emptyForm = {
  title: '',
  body: '',
  video_url: '',
  target_type: 'all' as 'all' | 'phase' | 'protocol',
  target_value: '',
  is_active: true,
  published_at: new Date().toISOString().slice(0, 16),
}

type FormState = typeof emptyForm

function toForm(m: AdminMessage): FormState {
  return {
    title:        m.title,
    body:         m.body,
    video_url:    m.video_url ?? '',
    target_type:  m.target_type,
    target_value: m.target_value ?? '',
    is_active:    m.is_active,
    published_at: m.published_at.slice(0, 16),
  }
}

export default function AdminMesajeClient({ messages }: { messages: AdminMessage[] }) {
  const router = useRouter()
  const [form, setForm]         = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  function set(key: keyof FormState, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'target_type') setForm(prev => ({ ...prev, target_type: value as FormState['target_type'], target_value: '' }))
  }

  function startEdit(m: AdminMessage) {
    setEditingId(m.id)
    setForm(toForm(m))
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      title:        form.title.trim(),
      body:         form.body.trim(),
      video_url:    form.video_url.trim() || null,
      target_type:  form.target_type,
      target_value: form.target_value.trim() || null,
      is_active:    form.is_active,
      published_at: new Date(form.published_at).toISOString(),
    }

    const url    = editingId ? `/api/admin/messages/${editingId}` : '/api/admin/messages'
    const method = editingId ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data   = await res.json().catch(() => ({})) as { error?: string }

    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Eroare.'); return }

    setSuccess(editingId ? 'Mesaj actualizat.' : 'Mesaj creat.')
    setEditingId(null)
    setForm(emptyForm)
    router.refresh()
  }

  async function toggleActive(m: AdminMessage) {
    await fetch(`/api/admin/messages/${m.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !m.is_active }),
    })
    router.refresh()
  }

  async function handleDelete(m: AdminMessage) {
    if (!window.confirm(`Ștergi mesajul "${m.title}"?`)) return
    await fetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const targetLabel = (m: AdminMessage) => {
    if (m.target_type === 'all') return 'Toți cursanții'
    if (m.target_type === 'phase') return `Faza: ${m.target_value}`
    if (m.target_type === 'protocol') return `Protocol: ${PROTOCOL_LABELS[m.target_value as keyof ProtocolFlags] ?? m.target_value}`
    return '—'
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">
          {editingId ? 'Editează mesaj' : 'Mesaj nou'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Titlu *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required disabled={saving} placeholder="Titlu mesaj..." />
          </div>
          <div>
            <label className="label">Text mesaj *</label>
            <textarea className="input min-h-[100px] resize-y" value={form.body} onChange={e => set('body', e.target.value)} required disabled={saving} placeholder="Conținut mesaj..." />
          </div>
          <div>
            <label className="label">Link video (YouTube / Vimeo / Loom — opțional)</label>
            <input className="input" type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} disabled={saving} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Target</label>
              <select className="input" value={form.target_type} onChange={e => set('target_type', e.target.value)} disabled={saving}>
                <option value="all">Toți cursanții</option>
                <option value="phase">O anumită fază</option>
                <option value="protocol">Un anumit protocol</option>
              </select>
            </div>
            {form.target_type !== 'all' && (
              <div>
                <label className="label">{form.target_type === 'phase' ? 'Faza' : 'Protocol'}</label>
                <select className="input" value={form.target_value} onChange={e => set('target_value', e.target.value)} disabled={saving} required>
                  <option value="">— Selectează —</option>
                  {form.target_type === 'phase'
                    ? PROGRAM_PHASES.map(p => <option key={p.phase} value={p.phase}>{p.phase}</option>)
                    : PROTOCOL_KEYS.map(k => <option key={k} value={k}>{PROTOCOL_LABELS[k]}</option>)
                  }
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Dată publicare</label>
              <input className="input" type="datetime-local" value={form.published_at} onChange={e => set('published_at', e.target.value)} disabled={saving} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-brand-600" disabled={saving} />
                <span className="text-sm font-medium text-gray-700">Activ (vizibil pentru cursanți)</span>
              </label>
            </div>
          </div>

          {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Se salvează...' : editingId ? 'Salvează modificările' : 'Creează mesaj'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary" disabled={saving}>Anulează</button>
            )}
          </div>
        </form>
      </div>

      {/* Messages list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Mesaje existente ({messages.length})</h3>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Niciun mesaj creat încă.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {messages.map(m => (
              <div key={m.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`badge text-xs ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? 'Activ' : 'Inactiv'}
                      </span>
                      <span className="badge bg-blue-50 text-blue-700 text-xs">{targetLabel(m)}</span>
                      <span className="text-xs text-gray-400">{new Date(m.published_at).toLocaleDateString('ro-RO')}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">{m.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{m.body}</p>
                    {m.video_url && <p className="text-xs text-brand-500 mt-1 truncate">🎥 {m.video_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(m)} className="text-xs border border-gray-200 hover:border-brand-300 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-brand-700 transition-colors">
                      {m.is_active ? 'Dezactivează' : 'Activează'}
                    </button>
                    <button onClick={() => startEdit(m)} className="text-xs border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-700 transition-colors">
                      Editează
                    </button>
                    <button onClick={() => handleDelete(m)} className="text-xs border border-red-200 hover:border-red-400 px-2.5 py-1.5 rounded-lg text-red-500 hover:text-red-700 transition-colors">
                      Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
