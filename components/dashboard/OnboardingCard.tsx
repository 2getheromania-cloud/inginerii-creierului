'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    icon: '👤',
    title: 'Completează profilul',
    desc: 'Adaugă numele tău și configurează protocolul potrivit.',
    href: '/profil',
  },
  {
    icon: '📚',
    title: 'Citește resursele săptămânii',
    desc: 'Ghiduri, rețete și materiale pentru faza ta curentă.',
    href: '/resurse',
  },
  {
    icon: '✅',
    title: 'Completează primul raport',
    desc: 'Înregistrează prima zi — ia mai puțin de 2 minute.',
    href: '/dashboard#raport',
  },
  {
    icon: '💬',
    title: 'Intră în Comunitate',
    desc: 'Prezintă-te și conectează-te cu ceilalți cursanți.',
    href: '/chat',
  },
]

export default function OnboardingCard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleComplete() {
    setLoading(true)
    await fetch('/api/onboarding', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="card border-brand-200 bg-gradient-to-br from-brand-50 to-white">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl flex-shrink-0">🌱</span>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Bun venit în program!</h2>
          <p className="text-sm text-gray-500">Parcurge acești 4 pași pentru a începe în forță.</p>
        </div>
      </div>

      <ol className="space-y-3 mb-5">
        {STEPS.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={step.href} className="font-semibold text-sm text-gray-800 hover:text-brand-700 transition-colors flex items-center gap-1">
                <span className="mr-1">{step.icon}</span>
                {step.title} →
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <button
        onClick={handleComplete}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? 'Se salvează...' : 'Am înțeles, să începem!'}
      </button>
    </div>
  )
}
