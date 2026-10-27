// „Atelierul de luni" — exercițiile din ședința de mentorare de luni, construite
// din materialele programului. Pagina e găzduită pe site; aici o încadrăm în
// aplicație, cu meniul deasupra, ca să nu iasă cursantul din platformă.

import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'

export const dynamic = 'force-dynamic'

const ATELIER_URL = 'https://ingineriicreierului.ro/wp-content/uploads/2026/10/Atelierul-de-luni.html'

export default async function PaginaAtelier() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  return (
    <AppShell profile={profile}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atelierul de luni</h1>
          <p className="text-sm text-gray-500">Exercițiile din ședința de mentorare.</p>
        </div>
        <a
          href={ATELIER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          Deschide pe tot ecranul ↗
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <iframe
          src={ATELIER_URL}
          title="Atelierul de luni"
          allow="fullscreen"
          allowFullScreen
          className="block h-[calc(100vh-220px)] min-h-[560px] w-full"
        />
      </div>
    </AppShell>
  )
}
