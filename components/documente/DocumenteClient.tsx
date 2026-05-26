'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Document } from '@/lib/types'

interface Cursant {
  id: string
  name: string | null
  email: string
}

interface Props {
  userId: string
  isAdmin: boolean
  targetUserId?: string
  cursanti?: Cursant[]
}

interface Preview {
  url: string
  name: string
  type: 'pdf' | 'image' | 'other'
  previewError?: boolean
}

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`

function previewType(name: string): Preview['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  return 'other'
}

function PreviewModal({ preview, onClose, onSetError }: { preview: Preview; onClose: () => void; onSetError: (v: Preview) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const fallback = (
    <div className="text-center text-white/80 space-y-4 max-w-sm">
      <p className="text-base">Nu am putut deschide previzualizarea.</p>
      <div className="flex flex-col gap-2 items-center">
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white text-gray-900 text-sm font-medium px-5 py-2.5 rounded-xl"
        >
          Deschide în tab nou →
        </a>
        <a
          href={preview.url}
          download
          className="text-xs text-white/60 hover:text-white underline"
        >
          Descarcă documentul
        </a>
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black/80"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/60 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white text-sm font-medium truncate max-w-[70vw]">{preview.name}</span>
        <div className="flex items-center gap-3">
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 hover:text-white underline"
            onClick={e => e.stopPropagation()}
          >
            Deschide în tab nou
          </a>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Închide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        {preview.previewError ? (
          fallback
        ) : preview.type === 'pdf' ? (
          <iframe
            src={preview.url}
            className="w-full h-full rounded-lg"
            style={{ minHeight: '70vh' }}
            title={preview.name}
            onError={() => onSetError({ ...preview, previewError: true })}
          />
        ) : preview.type === 'image' ? (
          <img
            src={preview.url}
            alt={preview.name}
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
            onError={() => onSetError({ ...preview, previewError: true })}
          />
        ) : (
          // DOCX and other non-previewable types
          <div className="text-center text-white/80 space-y-4 max-w-sm">
            <p className="text-base">Previzualizare indisponibilă pentru fișiere <strong className="text-white">.{preview.name.split('.').pop()?.toUpperCase()}</strong>.</p>
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-gray-900 text-sm font-medium px-5 py-2.5 rounded-xl"
            >
              Descarcă pentru vizualizare →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DocumenteClient({ userId, isAdmin, targetUserId, cursanti = [] }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGlobal, setIsGlobal] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkUserId, setLinkUserId] = useState('')
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [showLinkForm, setShowLinkForm] = useState(false)

  const targetId = targetUserId ?? userId
  const showGlobalControls = isAdmin && !targetUserId

  useEffect(() => {
    const params = targetId !== userId ? `?user_id=${targetId}` : ''
    fetch(`/api/documents${params}`)
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => { throw new Error(d.error ?? 'Eroare la încărcare.') }))
      .then(setDocuments)
      .catch(err => setError(err.message))
  }, [targetId, userId])

  const handlePreview = useCallback(async (doc: Document) => {
    if (doc.file_path?.startsWith('http')) {
      window.open(doc.file_path, '_blank', 'noopener,noreferrer')
      return
    }
    setLoadingPreviewId(doc.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError('Nu am putut deschide previzualizarea. Poți descărca documentul.')
        return
      }
      setPreview({ url: data.url, name: doc.name, type: previewType(doc.name) })
    } catch {
      setError('Nu am putut deschide previzualizarea. Poți descărca documentul.')
    } finally {
      setLoadingPreviewId(null)
    }
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Fișierul depășește 10 MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('user_id', targetId)
    if (showGlobalControls && isGlobal) form.append('is_global', 'true')

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Eroare la încărcare.'); return }
      setDocuments(prev => [data as Document, ...prev])
    } catch {
      setError('Eroare de rețea. Încearcă din nou.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDownload(doc: Document) {
    setError(null)
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error ?? 'Nu s-a putut genera link-ul de descărcare.'); return }
      window.open(data.url, '_blank')
    } catch {
      setError('Eroare la descărcare.')
    }
  }

  async function handleToggleGlobal(doc: Document) {
    const next = !doc.is_global
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_global: next }),
      })
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, is_global: next } : d))
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setError(d.error ?? 'Eroare la actualizare.')
      }
    } catch {
      setError('Eroare de rețea.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Ștergi acest document?')) return
    setError(null)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id))
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setError(d.error ?? 'Eroare la ștergere.')
      }
    } catch {
      setError('Eroare de rețea.')
    }
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault()
    setLinkError(null)
    if (!linkUserId) { setLinkError('Selectează un cursant.'); return }
    if (!linkName.trim()) { setLinkError('Introduceți un nume.'); return }
    if (!linkUrl.trim()) { setLinkError('Introduceți un URL.'); return }
    setLinkSaving(true)
    try {
      const res = await fetch('/api/documents/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: linkUserId, name: linkName.trim(), url: linkUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setLinkError(data.error ?? 'Eroare.'); return }
      setDocuments(prev => [data as Document, ...prev])
      setLinkName(''); setLinkUrl(''); setLinkUserId(''); setShowLinkForm(false)
    } catch {
      setLinkError('Eroare de rețea.')
    } finally {
      setLinkSaving(false)
    }
  }

  return (
    <>
      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} onSetError={setPreview} />}

      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="underline text-xs flex-shrink-0">ok</button>
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => { setError(null); fileRef.current?.click() }}
            disabled={uploading}
            className="btn-primary"
          >
            {uploading ? 'Se încarcă...' : 'Încarcă document'}
          </button>
          <p className="text-xs text-gray-400">PDF, JPG, PNG, DOCX — max 10 MB</p>
          {showGlobalControls && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={e => setIsGlobal(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
              <span className="text-sm text-gray-600">Vizibil tuturor cursanților</span>
            </label>
          )}

          {showGlobalControls && cursanti.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowLinkForm(v => !v); setLinkError(null) }}
                className="text-sm text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {showLinkForm ? 'Anulează' : 'Adaugă link pentru cursant'}
              </button>

              {showLinkForm && (
                <form onSubmit={handleSaveLink} className="mt-3 space-y-2">
                  {linkError && (
                    <p className="text-xs text-red-600">{linkError}</p>
                  )}
                  <select
                    value={linkUserId}
                    onChange={e => setLinkUserId(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  >
                    <option value="">— Selectează cursant —</option>
                    {cursanti.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nume document (ex: Plan personalizat)"
                    value={linkName}
                    onChange={e => setLinkName(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <input
                    type="url"
                    placeholder="URL (https://drive.google.com/... sau orice alt link)"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <button
                    type="submit"
                    disabled={linkSaving}
                    className="btn-primary text-sm py-1.5"
                  >
                    {linkSaving ? 'Se salvează...' : 'Trimite link cursantului'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Niciun document încărcat.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                {/* Name + meta — full width, never squeezed by buttons */}
                <div className="flex items-start gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800 break-all">{doc.name}</p>
                      {doc.is_global && (
                        <span className="flex-shrink-0 text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                          Global
                        </span>
                      )}
                      {doc.file_path?.startsWith('http') && (
                        <span className="flex-shrink-0 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          {doc.file_path.includes('drive.google.com') ? 'Drive' : 'Link'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                      {doc.size_bytes ? fmtSize(doc.size_bytes) : ''}
                      {doc.size_bytes ? ' · ' : ''}
                      {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>
                {/* Action buttons — own row, never overlap name */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handlePreview(doc)}
                    disabled={loadingPreviewId === doc.id}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    {loadingPreviewId === doc.id ? '...' : doc.file_path?.startsWith('http') ? 'Deschide' : 'Vizualizează'}
                  </button>
                  {!doc.file_path?.startsWith('http') && (
                    <button onClick={() => handleDownload(doc)} className="btn-secondary text-xs py-1 px-3">
                      Descarcă
                    </button>
                  )}
                  {showGlobalControls && (
                    <button
                      onClick={() => handleToggleGlobal(doc)}
                      className={`text-xs py-1 px-3 rounded-lg border transition-colors ${
                        doc.is_global
                          ? 'border-brand-200 text-brand-600 hover:bg-brand-50'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {doc.is_global ? 'Retrage' : 'Distribuie'}
                    </button>
                  )}
                  {(isAdmin || doc.uploaded_by === userId) && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs py-1 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Șterge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
