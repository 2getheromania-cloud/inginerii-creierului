'use client'
import { useState, useEffect, useRef } from 'react'
import type { Document } from '@/lib/types'

interface Props {
  userId: string
  isAdmin: boolean
  targetUserId?: string
}

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`

export default function DocumenteClient({ userId, isAdmin, targetUserId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const targetId = targetUserId ?? userId

  useEffect(() => {
    const params = targetId !== userId ? `?user_id=${targetId}` : ''
    fetch(`/api/documents${params}`)
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => { throw new Error(d.error ?? 'Eroare la încărcare.') }))
      .then(setDocuments)
      .catch(err => setError(err.message))
  }, [targetId, userId])

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

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Eroare la încărcare.')
        return
      }

      // Optimistic local prepend — no refetch needed
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
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Nu s-a putut genera link-ul de descărcare.')
        return
      }
      window.open(data.url, '_blank')
    } catch {
      setError('Eroare la descărcare.')
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs flex-shrink-0">ok</button>
        </div>
      )}

      <div>
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
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — max 10 MB</p>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">Niciun document încărcat.</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">
                  {doc.size_bytes ? fmtSize(doc.size_bytes) : ''}
                  {doc.size_bytes ? ' · ' : ''}
                  {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button onClick={() => handleDownload(doc)} className="btn-secondary text-xs py-1 px-3">
                  Descarcă
                </button>
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
  )
}
