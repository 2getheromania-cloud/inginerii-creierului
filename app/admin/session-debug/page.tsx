import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import SessionDebugClient from './SessionDebugClient'

export const dynamic = 'force-dynamic'

export default async function SessionDebugPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const cookieStore = cookies()
  const allNames = cookieStore.getAll().map(c => c.name).sort()
  const supabaseNames = allNames.filter(n => n.startsWith('sb-') || n.includes('supabase'))

  return (
    <AppShell profile={profile}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Session Debug</h1>
          <p className="text-sm text-gray-500 mt-1">
            Accesează această pagină de pe dispozitivul afectat pentru a diagnostica problema.
            Nu se afișează tokenuri sau valori sensibile.
          </p>
        </div>

        {/* Server-side info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Server-side (request cookies)</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3 items-start">
              <dt className="text-gray-500 flex-shrink-0 w-44 text-xs pt-0.5">Email</dt>
              <dd className="font-mono text-gray-900 break-all">{user.email}</dd>
            </div>
            <div className="flex gap-3 items-start">
              <dt className="text-gray-500 flex-shrink-0 w-44 text-xs pt-0.5">Are sesiune server</dt>
              <dd className="text-green-700 font-semibold">✅ da (middleware a trecut)</dd>
            </div>
            <div className="flex gap-3 items-start">
              <dt className="text-gray-500 flex-shrink-0 w-44 text-xs pt-0.5">Cookie-uri Supabase</dt>
              <dd className={`font-mono text-sm break-all ${supabaseNames.length === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                {supabaseNames.length > 0 ? supabaseNames.join(', ') : '❌ lipsă — sesiunea nu va persista'}
              </dd>
            </div>
            <div className="flex gap-3 items-start">
              <dt className="text-gray-500 flex-shrink-0 w-44 text-xs pt-0.5">Toate cookie-urile</dt>
              <dd className="font-mono text-xs text-gray-400 break-all">
                {allNames.join(', ') || '— niciun cookie'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Client-side info — rendered in browser */}
        <SessionDebugClient />

        {/* Diagnostic guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Ghid diagnostic</h2>
          <ul className="space-y-1.5 text-sm text-amber-900">
            <li>• <strong>Mod afișare = &quot;browser tab&quot;</strong> → utilizatoarea nu folosește PWA instalată</li>
            <li>• <strong>Cookies Supabase = lipsă</strong> → sesiunea nu a fost salvată; probabil Private Browsing sau cookie-uri blocate</li>
            <li>• <strong>PWA standalone = da + iOS &lt; 16.4</strong> → cookie-urile Safari și PWA sunt SEPARATE; autentificarea trebuie făcută direct din PWA</li>
            <li>• <strong>Cookies activate = nu</strong> → browser blocat total; autentificarea nu poate funcționa</li>
            <li>• <strong>Sesiune expiră</strong> → dacă data e în trecut, refresh token-ul a eșuat; trebuie reautentificare</li>
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Verifică: Setări iOS → Safari → Prevenire urmărire cross-site → poate afecta cookie-urile în unele versiuni.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
