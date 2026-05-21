'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()

  const targetId = targetUserId ?? userId

  async function loadDocuments() {
    const params = targetId !== userId ? `?user_id=${targetId}` : ''
    const res = await fetch(`/api/documents${params}`)
    if (res.ok) {
      const data = await res.json()
      setDocuments(data)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [targetId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Fișierul depășește 10MB.')
      return
    }
    setUploading(true)
    setError(null)

    const filePath = `${targetId}/${Date.now()}_${file.name}`
    const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, file)
    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: targetId,
        name: file.name,
        file_path: filePath,
        size_bytes: file.size,
      }),
    })

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la salvarea documentului.')
      return
    }

    await loadDocuments()
  }

  async function handleDownload(doc: Document) {
    const { data, error: signErr } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600)
    if (signErr || !data?.signedUrl) {
      setError('Nu s-a putut genera link-ul de descărcare.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(id: string) {
    if (!confirm('Ștergi acest document?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocuments(prev => prev.filter(d => d.id !== id))
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la ștergere.')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">ok</button>
        </p>
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
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading ? 'Se încarcă...' : 'Încarcă document'}
        </button>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — max 10MB</p>
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
                  {doc.size_bytes ? fmtSize(doc.size_bytes) : ''}{' '}
                  &middot; {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button
                  onClick={() => handleDownload(doc)}
                  className="btn-secondary text-xs py-1 px-3"
                >
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
