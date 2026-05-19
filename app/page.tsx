import LoginForm from '@/components/auth/LoginForm'
import { PROGRAM_PHASES } from '@/lib/program'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">IC</div>
          <span className="text-xl font-bold text-gray-900">Inginerii Creierului</span>
        </div>
        <p className="text-sm text-brand-700 font-medium">Program de refacere a microbiomului intestinal</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — hero */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Transformă-ți microbiomul,{' '}
              <span className="text-brand-600">transformă-ți viața</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Un program de 24 de săptămâni ghidat, cu urmărire zilnică a progresului,
              rețete personalizate și suport expert pentru refacerea microbiomului intestinal.
            </p>

            {/* Faze */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Structura programului
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PROGRAM_PHASES.map(({ phase, weeks }) => (
                  <div key={phase} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{phase}</p>
                      <p className="text-xs text-gray-500">{weeks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — login */}
          <div className="flex justify-center">
            <LoginForm />
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: '📋', title: 'Checklist zilnic', desc: 'Urmărești fiecare masă, supliment și activitate cu precizie.' },
            { icon: '📊', title: 'Grafice de progres', desc: 'Vizualizezi evoluția indicatorilor tăi în timp.' },
            { icon: '🔔', title: 'Remindere automate', desc: 'Primești notificări zilnice și rezumate săptămânale.' },
          ].map(f => (
            <div key={f.title} className="card text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Inginerii Creierului. Toate drepturile rezervate.
      </footer>
    </div>
  )
}
