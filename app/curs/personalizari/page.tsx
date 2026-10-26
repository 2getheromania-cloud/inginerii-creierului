// Protocoalele personalizate. Cursantul le vede doar pe cele bifate de echipă
// în fișa lui (Admin → Cursant → Protocoale personalizate); adminul le vede pe toate.

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { PERSONALIZARI, personalizareActiva } from '@/lib/curs-microbiom'
import { Cadru, Sprancena, RandMaterial } from '@/components/curs/ui'
import { contextCurs } from '../context'

export const dynamic = 'force-dynamic'

export default async function PaginaPersonalizari({
  searchParams,
}: {
  searchParams: Promise<{ saptamana?: string }>
}) {
  const { saptamana: ceruta } = await searchParams
  const { profile, admin, protocoale, cu } = await contextCurs(ceruta)
  const vizibile = PERSONALIZARI.filter(p => admin || personalizareActiva(p, protocoale))

  return (
    <AppShell profile={profile}>
      <Cadru>
        <Link href={cu('/curs')} className="text-sm font-semibold text-[#8F6E2A] hover:underline">
          ← Tot cursul
        </Link>

        <div className="mt-6">
          <Sprancena>Personalizări</Sprancena>
          <h1 className="mt-1 font-serif text-3xl leading-tight">
            {admin ? 'Toate personalizările' : 'Protocoalele tale'}
          </h1>
          <p className="mt-3 text-[#5E534A]">
            {admin
              ? 'Cursanții văd doar protocoalele bifate în fișa lor.'
              : 'Stabilite de echipă pentru situația ta. Se parcurg împreună cu programul, nu în locul lui.'}
          </p>
        </div>

        {vizibile.length === 0 ? (
          <p className="mt-8 text-[#5E534A]">
            Nu ai protocoale personalizate. Dacă echipa îți recomandă unul, apare aici.
          </p>
        ) : (
          vizibile.map(p => (
            <section key={p.cheie} className="mt-8">
              <h2 className="border-b border-[#E2D8C8] pb-2 font-serif text-xl">{p.titlu}</h2>
              <p className="mt-2 text-sm text-[#5E534A]">{p.rezumat}</p>
              <ul className="mt-1">
                {p.materiale.map(m => (
                  <RandMaterial key={m.titlu} material={m} deschis saptamana={1} />
                ))}
              </ul>
            </section>
          ))
        )}
      </Cadru>
    </AppShell>
  )
}
