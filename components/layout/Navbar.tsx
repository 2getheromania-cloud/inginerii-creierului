'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const CURSANT_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat',      label: 'Comunitate' },
  { href: '/mesaje',    label: 'Mesaje' },
  { href: '/documente', label: 'Documente' },
  { href: '/istoric',   label: 'Istoric' },
  { href: '/resurse',   label: 'Resurse' },
  { href: '/profil',    label: 'Profil' },
]

const ADMIN_NAV = [
  { href: '/admin',            label: 'Cursanți' },
  { href: '/chat',             label: 'Comunitate' },
  { href: '/mesaje',           label: 'Mesaje' },
  { href: '/documente',        label: 'Documente' },
  { href: '/admin/notificari', label: 'Notificări' },
  { href: '/admin/rapoarte',   label: 'Rapoarte' },
]

export default function Navbar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const nav = isAdmin ? ADMIN_NAV : CURSANT_NAV

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">IC</div>
            <span className="font-semibold text-gray-900 hidden sm:inline">Inginerii Creierului</span>
          </Link>

          <div className="flex items-center gap-1">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href || (href !== '/admin' && href !== '/dashboard' && pathname.startsWith(href))
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="badge bg-purple-100 text-purple-700">Admin</span>
          )}
          <span className="text-sm text-gray-600 hidden md:inline">{profile.name || profile.email}</span>
          <button onClick={signOut} className="btn-secondary text-sm py-1.5 px-3">
            Ieși
          </button>
        </div>
      </div>
    </nav>
  )
}
