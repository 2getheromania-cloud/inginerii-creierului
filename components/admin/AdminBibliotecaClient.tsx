'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getVideoEmbedUrl } from '@/lib/utils'
import type { VideoResource, VideoCategory } from '@/lib/types'

const CATEGORIES: { key: VideoCategory; label: string }[] = [
  { key: 'microbiom', label: 'Microbiom' },
  { key: 'nutritie',  label: 'Nutriție' },
  { key: 'somn',      label: 'Somn' },
  { key: 'stres',     label: 'Stres' },
  { key: 'mindset',   label: 'Mindset' },
  { key: 'tiroida',   label: 'Tiroidă' },
  { key: 'general',   label: 'General' },
]

const PHASES = ['Detox 21', 'Tranziție', 'Faza 1', 'Faza 2', 'Faza 3', 'Faza 4']
const PROTOCOLS = [
  { key: 'sibo', label: 'SIBO' },
  { key: 'candidoza', label: 'Candidoză' },
  { key: 'rezistenta_insulina', label: 'Rezistență insulină' },
  { key: 'tiroida', label: 'Tiroidă' },
]

type FormData = {
  title: string
  description: string
  video_url: string
  category: VideoCategory
  target_type: 'all' | 'phase' | 'protocol'
  target_value: string
  is_active: boolean
  sort_order: number
}

const EMPTY: FormData = {
  title: '',
  description: '',
  video_url: '',
  category: 'general',
  target_type: 'all',
  target_value: '',
  is_active: true,
  sort_order: 0,
}

export default function AdminBibliotecaClient({ initial }: { initial: VideoResource[] }) {
  const router = useRouter()
  const [videos, setVideos] = useState(initial)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  function openNew() { setEditing('new'); setForm(EMPTY); setPreviewUrl('') }
  function openEdit(v: VideoResource) {
    setEditing(v.id)
    setForm({
      title: v.title,
      description: v.description ?? '',
      video_url: v.video_url,
      category: v.category,
      target_type: v.target_type,
      target_value: v.target_value ?? '',
      is_active: v.is_active,
      sort_order: v.sort_order,
    })
    setPreviewUrl(v.video_url)
  }
  function closeForm() { setEditing(null); setForm(EMPTY) }

  async function handleSave() {
    if (!form.title || !form.video_url) return
    setSaving(true)
    const method = editing === 'new' ? 'POST' : 'PUT'
    const body = editing === 'new' ? form : { ...form, id: editing }
    const res = await fetch('/api/admin/video-resources', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) return
    closeForm()
    router.refresh()
    const updated = await fetch('/api/admin/video-resources').then(r => r.json()) as VideoResource[]
    setVideos(updated)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Ștergi "${title}"?`)) return
    setDeleting(id)
    await fetch('/api/admin/video-resources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  async function toggleActive(v: VideoResource) {
    await fetch('/api/admin/video-resources', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v, is_active: !v.is_active }),
    })
    setVideos(prev => prev.map(x => x.id === v.id ? { ...x, is_active: !x.is_active } : x))
  }

  const embed = getVideoEmbedUrl(previewUrl)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{videos.length} resurse video</p>
        <button onClick={openNew} className="btn-primary text-sm">+ Adaugă video</button>
      </div>

      {/* Form */}
      {editing && (
        <div className="card border-brand-200 bg-brand-50/30 space-y-4">
          <h3 className="font-semibold text-gray-800">
            {editing === 'new' ? 'Video nou' : 'Editează video'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <input
                placeholder="Titlu *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input w-full text-sm"
              />
              <input
                placeholder="URL video (YouTube / Vimeo / Loom) *"
                value={form.video_url}
                onChange={e => { setForm(f => ({ ...f, video_url: e.target.value })); setPreviewUrl(e.target.value) }}
                className="input w-full text-sm"
              />
              <textarea
                placeholder="Descriere (opțional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input w-full text-sm resize-none"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Categorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as VideoCategory }))}
                    className="input w-full text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ordine</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="input w-full text-sm"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vizibil pentru</label>
                <select
                  value={form.target_type}
                  onChange={e => setForm(f => ({ ...f, target_type: e.target.value as 'all' | 'phase' | 'protocol', target_value: '' }))}
                  className="input w-full text-sm"
                >
                  <option value="all">Toți cursanții</option>
                  <option value="phase">O anumită fază</option>
                  <option value="protocol">Un protocol specific</option>
                </select>
              </div>
              {form.target_type === 'phase' && (
                <select
                  value={form.target_value}
                  onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                  className="input w-full text-sm"
                >
                  <option value="">Selectează faza</option>
                  {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              {form.target_type === 'protocol' && (
                <select
                  value={form.target_value}
                  onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                  className="input w-full text-sm"
                >
                  <option value="">Selectează protocolul</option>
                  {PROTOCOLS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600"
                />
                Activ (vizibil pentru cursanți)
              </label>
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              {embed ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <iframe src={embed} className="w-full h-full" allowFullScreen />
                </div>
              ) : previewUrl ? (
                <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center">
                  <p className="text-xs text-gray-400">URL nerecunoscut. Suport: YouTube, Vimeo, Loom.</p>
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                  <p className="text-xs text-gray-400">Introdu URL-ul pentru preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <button onClick={closeForm} className="btn-secondary text-sm">Anulează</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-4 py-3">Titlu</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Categorie</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Vizibil</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {videos.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Nicio resursă video adăugată.</td></tr>
            )}
            {videos.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{v.title}</p>
                  {v.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.description}</p>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="badge bg-gray-100 text-gray-700 text-xs">{v.category}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                  {v.target_type === 'all' ? 'Toți' : `${v.target_type}: ${v.target_value}`}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(v)}
                    className={`badge text-xs cursor-pointer hover:opacity-80 transition-opacity ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {v.is_active ? 'Activ' : 'Inactiv'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(v)} className="text-xs text-brand-600 hover:underline font-medium">Editează</button>
                    <button
                      onClick={() => handleDelete(v.id, v.title)}
                      disabled={deleting === v.id}
                      className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50"
                    >
                      {deleting === v.id ? '...' : 'Șterge'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
