// Pagina de start a cursului: unde ești, ce ai de făcut săptămâna aceasta și
// drumul întreg, cu lacăt pe ce urmează.

import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import {
  SECTIUNI,
  PSIHOLOGIE,
  BONUS,
  PERSONALIZARI,
  TOTAL_SAPTAMANI,
  SAPTAMANI_INTENSIVE,
  sectiuneaCurenta,
  sectiuneDeschisa,
  materialDeschis,
  materialeleSaptamanii,
  personalizareActiva,
  saptamanaMaterialului,
  etichetaSaptamani,
  type Sectiune,
} from '@/lib/curs-microbiom'
import { Cadru, Sprancena, RandMaterial, BaraProgres, BandaAdmin } from '@/components/curs/ui'
import { contextCurs } from './context'

export const dynamic = 'force-dynamic'

export default async function PaginaCurs({
  searchParams,
}: {
  searchParams: Promise<{ saptamana?: string }>
}) {
  const { saptamana: ceruta } = await searchParams
  const ctx = await contextCurs(ceruta)
  const { profile, saptamana, admin, esteAdmin, previzualizare, protocoale, cu } = ctx

  const curenta = sectiuneaCurenta(saptamana)
  const deFacut = materialeleSaptamanii(saptamana)
  const ghiduriDeschise = PSIHOLOGIE.grupuri[0].materiale.filter(m =>
    materialDeschis(m, PSIHOLOGIE, saptamana, admin)
  ).length
  const personalizari = PERSONALIZARI.filter(p => admin || personalizareActiva(p, protocoale))
  const etapa = saptamana <= SAPTAMANI_INTENSIVE ? 'partea intensivă' : 'monitorizarea'

  return (
    <AppShell profile={profile}>
      {esteAdmin && (
        <BandaAdmin previzualizare={previzualizare} saptamanaProprie={profile.week} actiune="/curs" />
      )}

      {/* ── Antet: unde ești ── */}
      <section className="mx-auto max-w-3xl rounded-3xl bg-[#133D13] px-5 py-8 text-[#F1EAE0] sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
          Program Refacere Microbiom Intestinal
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
          Săptămâna {saptamana}
          <span className="text-[#F1EAE0]/50"> din {TOTAL_SAPTAMANI}</span>
        </h1>
        <p className="mt-2 text-[#F1EAE0]/80">
          {curenta.titlu} · {etapa}
        </p>
        <BaraProgres saptamana={saptamana} />
        <Link
          href={cu(`/curs/${curenta.slug}`)}
          className="mt-6 inline-block rounded-xl bg-[#B08A3C] px-5 py-2.5 font-semibold text-[#1C1713] hover:bg-[#C49B47]"
        >
          Continuă cu {curenta.titlu} →
        </Link>
      </section>

      <div className="mt-6 space-y-6">
        {/* ── Săptămâna aceasta ── */}
        <Cadru>
          <Sprancena>Săptămâna aceasta</Sprancena>
          <h2 className="mt-1 font-serif text-2xl">Ce se deschide acum</h2>
          {deFacut.length === 0 ? (
            <p className="mt-3 text-[#5E534A]">
              Nimic nou săptămâna aceasta. Continui cu materialele din {curenta.titlu} și cu
              raportarea zilnică.
            </p>
          ) : (
            <ul className="mt-4">
              {deFacut.map(({ sectiune, material }) => (
                <RandMaterial
                  key={sectiune.slug + material.titlu}
                  material={material}
                  deschis={materialDeschis(material, sectiune, saptamana, admin)}
                  saptamana={saptamanaMaterialului(material, sectiune)}
                />
              ))}
            </ul>
          )}
        </Cadru>

        {/* ── Drumul întreg ── */}
        <Cadru>
          <Sprancena>Drumul</Sprancena>
          <h2 className="mt-1 font-serif text-2xl">Cele 24 de săptămâni</h2>
          <ol className="mt-4">
            {SECTIUNI.map(s => (
              <RandSectiune
                key={s.slug}
                sectiune={s}
                href={cu(`/curs/${s.slug}`)}
                deschisa={sectiuneDeschisa(s, saptamana, admin)}
                curenta={s.slug === curenta.slug}
              />
            ))}
          </ol>
        </Cadru>

        {/* ── Pe tot parcursul ── */}
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <Carte
            href={cu(`/curs/${PSIHOLOGIE.slug}`)}
            sprancena="Psihologie funcțională"
            titlu="Cei 12 pași"
            text={`${ghiduriDeschise} din 12 ghiduri deschise. Câte unul nou în fiecare săptămână.`}
          />
          <Carte
            href={cu('/curs/inregistrari')}
            sprancena="Înregistrări"
            titlu="Întâlnirile de mentorare"
            text="Toate sesiunile înregistrate, pe luni, din 2024 până acum."
          />
          <Carte
            href={cu(`/curs/${BONUS.slug}`)}
            sprancena="Protocoale bonus"
            titlu="La recomandarea echipei"
            text="Somn, stres traumatic, ficat, fier, suprarenale, infecții și altele."
          />
          {personalizari.length > 0 ? (
            <Carte
              href={cu('/curs/personalizari')}
              sprancena={admin ? 'Personalizări (toate)' : 'Personalizările tale'}
              titlu={personalizari.map(p => p.titlu).join(' · ')}
              text="Protocoalele stabilite de echipă pentru tine."
            />
          ) : (
            <Carte
              href="/resurse"
              sprancena="Resurse"
              titlu="Materiale generale"
              text="Ghidul de nutriție, suplimentele și rețetele fazei curente."
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function RandSectiune({
  sectiune,
  href,
  deschisa,
  curenta,
}: {
  sectiune: Sectiune
  href: string
  deschisa: boolean
  curenta: boolean
}) {
  const continut = (
    <>
      <span
        className={
          'w-8 flex-none text-right font-serif text-2xl leading-none ' +
          (deschisa ? 'text-[#B08A3C]' : 'text-[#CFC2AC]')
        }
      >
        {sectiune.numar}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">
          {sectiune.titlu}
          {curenta && (
            <span className="ml-2 rounded-full bg-[#133D13] px-2 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-widest text-[#F1EAE0]">
              acum
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-[#5E534A]">{sectiune.rezumat}</span>
        <span className="mt-1 block text-xs text-[#5E534A]">
          {deschisa ? etichetaSaptamani(sectiune) : `🔒 Se deschide în săptămâna ${sectiune.deLa}`}
        </span>
      </span>
    </>
  )

  return (
    <li className="border-t border-[#E2D8C8] first:border-t-0">
      {deschisa ? (
        <Link href={href} className="flex gap-4 py-4 hover:text-[#8F6E2A]">
          {continut}
        </Link>
      ) : (
        <div className="flex gap-4 py-4 opacity-60">{continut}</div>
      )}
    </li>
  )
}

function Carte({
  href,
  sprancena,
  titlu,
  text,
}: {
  href: string
  sprancena: string
  titlu: string
  text: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-[#FBF8F2] px-6 py-6 text-[#1C1713] shadow-sm ring-1 ring-[#E2D8C8] transition hover:ring-[#B08A3C]"
    >
      <Sprancena>{sprancena}</Sprancena>
      <h3 className="mt-1 font-serif text-xl group-hover:text-[#8F6E2A]">{titlu}</h3>
      <p className="mt-2 text-sm text-[#5E534A]">{text}</p>
    </Link>
  )
}
