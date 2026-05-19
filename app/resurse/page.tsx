import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getPhaseFromWeek, PHASE_RECIPE_LINKS, PHASE_COLORS, PROGRAM_PHASES, PROTOCOL_LABELS, PROTOCOL_LINKS } from '@/lib/program'
import type { ProtocolFlags } from '@/lib/types'

export default async function ResursePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/')

  const phase = getPhaseFromWeek(profile.week)
  const activeFlags = Object.entries(profile.flags as ProtocolFlags)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof ProtocolFlags)

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Resurse program</h1>

        {/* Faza curentă */}
        <div className="card border-l-4 border-brand-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Faza ta curentă</p>
              <h2 className="text-2xl font-bold text-gray-900">{phase}</h2>
              <p className="text-gray-500 mt-1">Săptămâna {profile.week} din 24</p>
            </div>
            <a
              href={PHASE_RECIPE_LINKS[phase]}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Rețete curente →
            </a>
          </div>
        </div>

        {/* Toate fazele */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Toate fazele programului</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROGRAM_PHASES.map(({ phase: p, weeks }) => (
              <div
                key={p}
                className={`card ${p === phase ? 'ring-2 ring-brand-400' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${PHASE_COLORS[p]}`}>{p}</span>
                      {p === phase && <span className="badge bg-brand-100 text-brand-700">Curent</span>}
                    </div>
                    <p className="text-sm text-gray-500">{weeks}</p>
                  </div>
                  <a
                    href={PHASE_RECIPE_LINKS[p]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium hover:underline ${p === phase ? 'text-brand-600' : 'text-gray-400'}`}
                  >
                    Materiale →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocoale personalizate */}
        {activeFlags.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Protocoalele tale personalizate</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeFlags.map(flag => (
                <a
                  key={flag}
                  href={PROTOCOL_LINKS[flag]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="badge bg-amber-100 text-amber-800 mb-2">{PROTOCOL_LABELS[flag]}</span>
                      <p className="text-sm text-gray-500">Protocol personalizat activ</p>
                    </div>
                    <span className="text-brand-600 group-hover:translate-x-1 transition-transform text-lg">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Materiale generale */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Materiale generale</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Ghid nutriție',       icon: '🥗', desc: 'Principiile de bază ale alimentației în program.' },
              { title: 'Suplimente',           icon: '💊', desc: 'Lista completă de suplimente și dozaje.' },
              { title: 'Exerciții recomandate', icon: '🏋️', desc: 'Tipuri de mișcare potrivite fiecărei faze.' },
              { title: 'Gestionarea stresului', icon: '🧘', desc: 'Tehnici de meditație și relaxare.' },
              { title: 'Somn & recuperare',    icon: '😴', desc: 'Optimizarea somnului pentru sănătatea microbiomului.' },
              { title: 'FAQ program',          icon: '❓', desc: 'Întrebări frecvente din comunitate.' },
            ].map(item => (
              <div key={item.title} className="card hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
