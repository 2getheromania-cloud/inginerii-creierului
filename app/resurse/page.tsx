import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  getPhaseFromWeek,
  PHASE_RECIPE_CONFIGS,
  PHASE_COLORS,
  PROGRAM_PHASES,
  GENERAL_MATERIALS,
} from '@/lib/program'
import { cn } from '@/lib/utils'

export default async function ResursePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile) redirect('/')

  const phase           = getPhaseFromWeek(profile.week)
  const config          = PHASE_RECIPE_CONFIGS[phase]
  const activeProtocols = profile.protocols ?? []
  const isAdmin = profile.role === 'admin'

  const { data: protocolTypes } = await supabase
    .from('protocol_types')
    .select('name, drive_url')
    .eq('is_active', true)

  const ptMap = new Map((protocolTypes ?? []).map(p => [p.name, p.drive_url as string | null]))

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
        {activeProtocols.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Protocoalele tale personalizate</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeProtocols.map(name => {
                const url = ptMap.get(name) ?? null
                return (
                  <div key={name} className="card flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="badge bg-green-100 text-green-800 mb-1.5 inline-block">{name}</span>
                      <p className="text-sm text-gray-500">Protocol personalizat activ</p>
                      {!url && isAdmin && (
                        <p className="text-xs text-amber-600 mt-1">⚠ Fără link configurat</p>
                      )}
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm flex-shrink-0 whitespace-nowrap"
                      >
                        Deschide resurse →
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 flex-shrink-0 mt-1">Resurse indisponibile</span>
                    )}
                  </div>
                )
              })}
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
