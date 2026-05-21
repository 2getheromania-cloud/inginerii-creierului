import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/layout/PWARegister'

export const metadata: Metadata = {
  title: 'Inginerii Creierului — Program Microbiom',
  description: 'Programul de refacere a microbiomului intestinal Inginerii Creierului',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IC Microbiom',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
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
