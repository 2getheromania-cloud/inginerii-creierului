import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/layout/PWARegister'

export const metadata: Metadata = {
  title: 'Inginerii Creierului — Program Microbiom',
  description: 'Programul de refacere a microbiomului intestinal Inginerii Creierului',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Inginerii Creierului',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a3a2a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="min-h-screen">
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
