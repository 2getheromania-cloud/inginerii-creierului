// Cadrul programului „Resetarea Somnului".
//
// Ca la „Cele 7 Etape", nu folosește AppShell: acela e navigația programului
// de 6 luni. Cine a cumpărat programul de somn nu trebuie să vadă uși care
// nu i se deschid.

import type { Metadata } from 'next'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export const metadata: Metadata = {
  title: 'Resetarea Somnului — Inginerii Creierului',
  description: 'Programul de 21 de zile Inginerii Creierului pentru un somn odihnitor.',
}

export default function LayoutResetareaSomnului({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="somn min-h-screen bg-[#FBF8F2] text-[#1C1713]">
      <style>{`.somn .font-serif{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600}`}</style>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=swap"
      />
      <header className="bg-[#133D13] text-[#F1EAE0]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cele-7-etape/marca.png"
              alt=""
              className="h-8 w-8 flex-none rounded-full bg-[#FBF8F2] p-1"
            />
            <Link href="/resetarea-somnului" className="text-lg leading-none">
              <span className="text-[#B08A3C]">Inginerii</span> Creierului
            </Link>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/resetarea-somnului/jurnal" className="hover:text-[#D2AD5C]">Jurnal</Link>
            <Link href="/resetarea-somnului/test" className="hover:text-[#D2AD5C]">Test</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">{children}</main>

      <footer className="mx-auto max-w-3xl px-5 pb-12 text-xs text-[#5E534A]">
        Conținutul programului este educațional și nu înlocuiește consultul
        medical. Nu opri și nu modifica un tratament fără medicul tău.
        <div className="mt-6">
          <LegalFooter />
        </div>
      </footer>
    </div>
  )
}
