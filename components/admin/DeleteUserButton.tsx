'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  async function handleDelete() {
    const step1 = window.confirm(
      `Ești sigur că vrei să ștergi cursantul "${userName}"?\n\nAceastă acțiune este IREVERSIBILĂ și va șterge permanent:\n• toate rapoartele zilnice\n• profilul cursantului\n• contul de autentificare`
    )
    if (!step1) return

    const step2 = window.prompt(
      `Introdu "STERGE" (cu majuscule) pentru a confirma ștergerea permanentă a lui ${userName}:`
    )
    if (step2 !== 'STERGE') {
      if (step2 !== null) alert('Textul introdus nu este corect. Ștergerea a fost anulată.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/delete-user', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setError(data.error ?? 'Eroare la ștergere.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors"
      >
        {loading ? 'Se șterge...' : 'Șterge utilizator'}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
