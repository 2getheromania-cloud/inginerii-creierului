import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

const ZOOM_URL = 'https://us06web.zoom.us/j/81954263082?pwd=x9LbVecyxPZATtUZr50DdFJRHWGsvF.1'

export default async function IntalniriPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  return (
    <AppShell profile={profile}>
      <div className="space-y-8 max-w-2xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Întâlnirea săptămânală</h1>
          <p className="text-gray-500 mt-1">
            Aici poți intra direct la întâlnirile de grup Inginerii Creierului.
          </p>
        </div>

        {/* Card principal */}
        <div className="card border-l-4 border-brand-500 space-y-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Întâlnire de grup pe Zoom</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-medium text-gray-700">Luni, 19:30</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* CTA */}
          <div className="space-y-3">
            <a
              href={ZOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-base transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Intră pe Zoom
            </a>
            <p className="text-xs text-center text-gray-400">
              Linkul se deschide direct în Zoom sau în browser.
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Sfat</p>
            <p className="text-sm text-amber-700">
              Dacă aplicația Zoom este instalată pe dispozitiv, linkul se va deschide automat în ea.
              Altfel, întâlnirea va rula în browser.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
