import Navbar from './Navbar'
import type { Profile } from '@/lib/types'

interface Props {
  children: React.ReactNode
  profile: Profile
}

// UI pur — nu face auth check, nu face redirect. Paginile sunt responsabile.
export default function AppShell({ children, profile }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <main className="max-w-6xl mx-auto px-4 py-6 min-w-0">
        {children}
      </main>
    </div>
  )
}
