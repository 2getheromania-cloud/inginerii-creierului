'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountActions({
  userId,
  userName,
  active,
}: {
  userId: string
  userName: string
  active: boolean
}) {
  const router = useRouter()

  const [toggling, setToggling]   = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [error, setError]         = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function toggleActive() {
    setError('')
    setToggling(true)
    const res = await fetch('/api/admin/set-active', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, active: !active }),
    })
    setToggling(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setError(data.error ?? 'Eroare la actualizarea contului.')
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setError('')
    setDeleting(true)

    const res = await fetch('/api/admin/delete-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setError(data.error ?? 'Eroare la ștergere.')
      setDeleting(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="space-y-4">
      {/* ── Dezactivare / reactivare ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleActive}
          disabled={toggling || deleting}
          className={
            active
              ? 'bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors'
              : 'bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors'
          }
        >
          {toggling
            ? 'Se salvează...'
            : active ? 'Dezactivează cont' : 'Reactivează cont'}
        </button>
        <p className="text-sm text-gray-500">
          {active
            ? 'Cursantul nu va mai putea intra în aplicație. Rapoartele și documentele se păstrează.'
            : 'Contul este dezactivat. Reactivarea redă accesul imediat, cu toate datele intacte.'}
        </p>
      </div>

      {/* ── Ștergere permanentă ── */}
      <div className="border-t border-red-100 pt-4">
        {!confirmOpen ? (
          <button
            onClick={() => { setConfirmOpen(true); setConfirmText(''); setError('') }}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Șterge permanent
          </button>
        ) : (
          <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700">
              Ștergi definitiv contul lui <strong>{userName}</strong>, împreună cu rapoartele,
              documentele și mesajele sale. Acțiunea este <strong>ireversibilă</strong>.
            </p>
            <div>
              <label className="label">Scrie <code className="font-mono font-semibold">DELETE</code> pentru a confirma</label>
              <input
                type="text"
                autoFocus
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="input font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {deleting ? 'Se șterge...' : 'Confirm ștergerea permanentă'}
              </button>
              <button
                onClick={() => { setConfirmOpen(false); setConfirmText('') }}
                disabled={deleting}
                className="btn-secondary text-sm"
              >
                Anulează
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
