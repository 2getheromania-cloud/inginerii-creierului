import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inginerii Creierului — Program Microbiom',
  description: 'Programul de refacere a microbiomului intestinal Inginerii Creierului',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
