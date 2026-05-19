import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  getPhaseFromWeek,
  PHASE_RECIPE_CONFIGS,
  PHASE_COLORS,
  PROGRAM_PHASES,
  PROTOCOL_LABELS,
  PROTOCOL_LINKS,
  GENERAL_MATERIALS,
} from '@/lib/program'
import type { ProtocolFlags } from '@/lib/types'
import { cn } from '@/lib/utils'

export default async function ResursePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  const phase   = getPhaseFromWeek(profile.week)
  const config  = PHASE_RECIPE_CONFIGS[phase]
  const activeFlags = Object.entries(profile.flags as ProtocolFlags)
    .filter(([, v]) => v)
    .map(([k]) => k as keyof ProtocolFlags)

  return (
    <AppShell profile={profile}>
      <div className="space-y-10">
        <h1 className="text-2xl font-bold text-gray-900">Resurse program</h1>

        {/* ── Faza curentă + butoane rețete ── */}
        <div className="card border-l-4 border-brand-500">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Faza ta curentă</p>
              <h2 className="text-2xl font-bold text-gray-900">{phase}</h2>
              <p className="text-gray-500 mt-1">Săptămâna {profile.week} din 24</p>
            </div>

            {/* Butoane dinamice per tip de fază */}
            <div className="flex flex-wrap gap-2">
              {config.kind === 'single' ? (
                <a
                  href={config.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm"
                >
                  {config.label ?? 'Rețete curente'} →
                </a>
              ) : (
                <>
                  <a
                    href={config.vegetarian}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    Vegetarian →
                  </a>
                  <a
                    href={config.omnivor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Omnivor →
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Toate fazele programului ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Toate fazele programului</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROGRAM_PHASES.map(({ phase: p, weeks }) => {
              const cfg = PHASE_RECIPE_CONFIGS[p]
              const isCurrent = p === phase
              return (
                <div
                  key={p}
                  className={cn('card', isCurrent && 'ring-2 ring-brand-400')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn('badge', PHASE_COLORS[p])}>{p}</span>
                        {isCurrent && (
                          <span className="badge bg-brand-100 text-brand-700">Curentă</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{weeks}</p>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {cfg.kind === 'single' ? (
                        <a
                          href={cfg.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'text-sm font-medium hover:underline',
                            isCurrent ? 'text-brand-600' : 'text-gray-400'
                          )}
                        >
                          {cfg.label ?? 'Materiale'} →
                        </a>
                      ) : (
                        <>
                          <a
                            href={cfg.vegetarian}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'text-sm font-medium hover:underline',
                              isCurrent ? 'text-brand-600' : 'text-gray-400'
                            )}
                          >
                            Vegetarian →
                          </a>
                          <a
                            href={cfg.omnivor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'text-sm font-medium hover:underline',
                              isCurrent ? 'text-blue-600' : 'text-gray-400'
                            )}
                          >
                            Omnivor →
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Protocoale personalizate active ── */}
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
                      <span className="badge bg-amber-100 text-amber-800 mb-2 inline-block">
                        {PROTOCOL_LABELS[flag]}
                      </span>
                      <p className="text-sm text-gray-500">Protocol personalizat activ</p>
                    </div>
                    <span className="text-brand-600 group-hover:translate-x-1 transition-transform text-lg">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Materiale generale ── */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Materiale generale</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {GENERAL_MATERIALS.map(item => (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-brand-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
                <p className="text-xs text-brand-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Deschide →
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
