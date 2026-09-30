// Cadrul programului „Cele 7 Etape".
//
// Deliberat NU folosește AppShell: acela e navigația programului de 6 luni
// (jurnal zilnic, chat, întâlniri, rapoarte). Un om care a cumpărat harta nu
// are nimic de-a face cu ele și nu trebuie să vadă uși care nu i se deschid.

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cele 7 Etape ale Vindecării',
  description: 'Programul Inginerii Creierului — harta și instrumentele.',
}

export default function LayoutSapteEtape({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#1C1713]">
      <header className="bg-[#133D13] text-[#F1EAE0]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cele-7-etape/marca.png"
            alt=""
            className="h-8 w-8 flex-none rounded-full bg-[#FBF8F2] p-1"
          />
          <Link href="/cele-7-etape" className="text-lg leading-none">
            <span className="text-[#B08A3C]">Inginerii</span> Creierului
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">{children}</main>

      <footer className="mx-auto max-w-3xl px-5 pb-12 text-xs text-[#5E534A]">
        Conținutul programului este educațional și nu înlocuiește consultul
        medical. Nu opri și nu modifica un tratament fără medicul tău.
      </footer>
    </div>
  )
}
