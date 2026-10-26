// O secțiune a cursului: ce conține, pentru ce e, și materialele ei, cu
// săptămâna în care se deschide fiecare.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  SECTIUNI,
  gasesteSectiunea,
  sectiuneDeschisa,
  materialDeschis,
  saptamanaMaterialului,
  etichetaSaptamani,
} from '@/lib/curs-microbiom'
import { Cadru, Sprancena, RandMaterial, BandaAdmin } from '@/components/curs/ui'
import { contextCurs } from '../context'

export const dynamic = 'force-dynamic'

export default async function PaginaSectiune({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ saptamana?: string }>
}) {
  const { slug } = await params
  const { saptamana: ceruta } = await searchParams
  const sectiune = gasesteSectiunea(slug)
  if (!sectiune) notFound()

  const { profile, saptamana, admin, esteAdmin, previzualizare, cu } = await contextCurs(ceruta)
  const deschisa = sectiuneDeschisa(sectiune, saptamana, admin)

  const index = SECTIUNI.findIndex(s => s.slug === sectiune.slug)
  const anterioara = index > 0 ? SECTIUNI[index - 1] : null
  const urmatoare = index >= 0 && index < SECTIUNI.length - 1 ? SECTIUNI[index + 1] : null

  return (
    <AppShell profile={profile}>
      {esteAdmin && (
        <BandaAdmin
          previzualizare={previzualizare}
          saptamanaProprie={profile.week}
          actiune={`/curs/${sectiune.slug}`}
        />
      )}
      <Cadru>
        <Link href={cu('/curs')} className="text-sm font-semibold text-[#8F6E2A] hover:underline">
          ← Tot cursul
        </Link>

        <div className="mt-6">
          <Sprancena>{etichetaSaptamani(sectiune)}</Sprancena>
          <h1 className="mt-1 font-serif text-3xl leading-tight">{sectiune.titlu}</h1>
          <p className="mt-3 text-[#5E534A]">{sectiune.rezumat}</p>
        </div>

        {(sectiune.obiectiv || sectiune.intalniri) && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {sectiune.obiectiv && (
              <div className="rounded-xl bg-[#F3EDE2] px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-widest text-[#8F6E2A]">Obiectiv</dt>
                <dd className="mt-1 text-sm">{sectiune.obiectiv}</dd>
              </div>
            )}
            {sectiune.intalniri && (
              <div className="rounded-xl bg-[#F3EDE2] px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-widest text-[#8F6E2A]">Întâlniri</dt>
                <dd className="mt-1 text-sm">{sectiune.intalniri}</dd>
              </div>
            )}
          </dl>
        )}

        {!deschisa ? (
          <p className="mt-8 rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4">
            🔒 Secțiunea se deschide în săptămâna {sectiune.deLa}. Acum ești în săptămâna{' '}
            {saptamana}.
          </p>
        ) : (
          sectiune.grupuri.map((g, i) => (
            <section key={i} className="mt-8">
              {g.titlu && (
                <h2 className="border-b border-[#E2D8C8] pb-2 font-serif text-xl">{g.titlu}</h2>
              )}
              {g.compact ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {g.materiale.map(m => {
                    const deschis = materialDeschis(m, sectiune, saptamana, admin) && !!m.url
                    return (
                      <li key={m.titlu}>
                        {deschis ? (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded-full bg-[#133D13] px-4 py-1.5 text-sm font-semibold text-[#F1EAE0] hover:bg-[#1D531D]"
                          >
                            {m.titlu}
                          </a>
                        ) : (
                          <span className="inline-block rounded-full bg-[#EFE8DC] px-4 py-1.5 text-sm text-[#B5A78F]">
                            🔒 {m.titlu}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
              <ul className={g.titlu ? 'mt-1' : ''}>
                {g.materiale.map(m => (
                  <RandMaterial
                    key={m.titlu}
                    material={m}
                    deschis={materialDeschis(m, sectiune, saptamana, admin)}
                    saptamana={saptamanaMaterialului(m, sectiune)}
                  />
                ))}
              </ul>
              )}
              {g.compact && !materialDeschis(g.materiale[0], sectiune, saptamana, admin) && (
                <p className="mt-2 text-xs text-[#5E534A]">
                  Se deschid în săptămâna {saptamanaMaterialului(g.materiale[0], sectiune)}.
                </p>
              )}
            </section>
          ))
        )}

        {sectiune.nota && (
          <p className="mt-8 border-l-2 border-[#B08A3C] pl-4 text-sm text-[#5E534A]">
            {sectiune.nota}
          </p>
        )}

        <p className="mt-8 text-xs text-[#5E534A]">
          Materialele se deschid în Google Drive, cu adresa de email cu care ești înscris în
          program. Dacă un link nu se deschide, scrie-ne în Mesaje.
        </p>

        {!sectiune.extra && (
          <nav className="mt-8 flex justify-between gap-4 border-t border-[#E2D8C8] pt-5 text-sm">
            {anterioara ? (
              <Link
                href={cu(`/curs/${anterioara.slug}`)}
                className="font-semibold text-[#8F6E2A] hover:underline"
              >
                ← {anterioara.titlu}
              </Link>
            ) : (
              <span />
            )}
            {urmatoare && sectiuneDeschisa(urmatoare, saptamana, admin) ? (
              <Link
                href={cu(`/curs/${urmatoare.slug}`)}
                className="text-right font-semibold text-[#8F6E2A] hover:underline"
              >
                {urmatoare.titlu} →
              </Link>
            ) : urmatoare ? (
              <span className="text-right text-[#5E534A]">
                🔒 {urmatoare.titlu} · săpt. {urmatoare.deLa}
              </span>
            ) : (
              <span />
            )}
          </nav>
        )}
      </Cadru>
    </AppShell>
  )
}
