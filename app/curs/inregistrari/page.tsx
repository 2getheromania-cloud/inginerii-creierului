// Arhiva întâlnirilor de mentorare, pe ani și luni. Fiecare lună e un folder
// în Google Drive; aplicația doar le așază.

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { INREGISTRARI, INREGISTRARI_TOATE } from '@/lib/curs-microbiom'
import { Cadru, Sprancena } from '@/components/curs/ui'
import { contextCurs } from '../context'

export const dynamic = 'force-dynamic'

export default async function PaginaInregistrari({
  searchParams,
}: {
  searchParams: Promise<{ saptamana?: string }>
}) {
  const { saptamana: ceruta } = await searchParams
  const { profile, cu } = await contextCurs(ceruta)

  return (
    <AppShell profile={profile}>
      <Cadru>
        <Link href={cu('/curs')} className="text-sm font-semibold text-[#8F6E2A] hover:underline">
          ← Tot cursul
        </Link>

        <div className="mt-6">
          <Sprancena>Înregistrări</Sprancena>
          <h1 className="mt-1 font-serif text-3xl leading-tight">Întâlnirile de mentorare</h1>
          <p className="mt-3 text-[#5E534A]">
            Fiecare întâlnire de grup e înregistrată. Dacă ai lipsit sau vrei să reasculți o
            explicație, o găsești aici, în luna în care a avut loc. Dacă abia începi, pornește
            de la cele mai vechi.
          </p>
        </div>

        <a
          href={INREGISTRARI_TOATE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-xl bg-[#133D13] px-5 py-2.5 font-semibold text-[#F1EAE0] hover:bg-[#1D531D]"
        >
          Toate înregistrările ↗
        </a>

        {INREGISTRARI.map(({ an, luni }) => (
          <section key={an} className="mt-10">
            <h2 className="border-b border-[#E2D8C8] pb-2 font-serif text-2xl">{an}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {luni.map(({ luna, url }) => (
                <li key={luna}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-[#E2D8C8] hover:text-[#8F6E2A] hover:ring-[#B08A3C]"
                  >
                    <span className="font-semibold">{luna}</span>
                    <span className="text-xs text-[#8F6E2A]">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-10 text-xs text-[#5E534A]">
          Înregistrările se deschid în Google Drive, cu adresa de email cu care ești înscris în
          program.
        </p>
      </Cadru>
    </AppShell>
  )
}
