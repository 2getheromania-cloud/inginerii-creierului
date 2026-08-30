'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton({ label = 'Deconectează-te' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function signOut() {
    setLoading(true)
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={signOut} disabled={loading} className="btn-secondary text-sm disabled:opacity-50">
      {loading ? 'Se deconectează...' : label}
    </button>
  )
}
