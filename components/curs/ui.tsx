// Piesele vizuale ale cursului, în aceeași familie cu „Cele 7 Etape":
// hârtie caldă, titluri cu serife, auriu pentru ce e deschis, liniuțe fine
// între rânduri. Toate sunt componente de server: nu e nevoie de JavaScript
// în browser ca să deschizi un link.

import Link from 'next/link'
import type { Material, TipMaterial } from '@/lib/curs-microbiom'
import { esteExtern, TOTAL_SAPTAMANI, SAPTAMANI_INTENSIVE } from '@/lib/curs-microbiom'

export const C = {
  hartie: 'bg-[#FBF8F2]',
  cerneala: 'text-[#1C1713]',
  sters: 'text-[#5E534A]',
  auriu: 'text-[#B08A3C]',
  auriuInchis: 'text-[#8F6E2A]',
  linie: 'border-[#E2D8C8]',
}

export function Cadru({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-[#FBF8F2] px-5 py-8 text-[#1C1713] shadow-sm ring-1 ring-[#E2D8C8] sm:px-10 sm:py-10">
      {children}
    </div>
  )
}

export function Sprancena({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
      {children}
    </p>
  )
}

const ETICHETE: Record<TipMaterial, string> = {
  video: 'Video',
  audio: 'Audio',
  pdf: 'PDF',
  document: 'Document',
  folder: 'Folder',
  youtube: 'YouTube',
  pagina: 'Pagină',
  pas: 'De făcut',
}

const SEMNE: Record<TipMaterial, string> = {
  video: '▶',
  audio: '♪',
  pdf: '¶',
  document: '¶',
  folder: '▦',
  youtube: '▶',
  pagina: '→',
  pas: '✓',
}

export function RandMaterial({
  material,
  deschis,
  saptamana,
}: {
  material: Material
  deschis: boolean
  /** Săptămâna în care se deschide materialul. */
  saptamana: number
}) {
  const { titlu, descriere, tip, url, inLucru } = material
  const clic = deschis && !!url

  const continut = (
    <>
      <span
        aria-hidden
        className={
          'mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm ' +
          (clic
            ? 'bg-[#133D13] text-[#F1EAE0]'
            : deschis && tip === 'pas'
              ? 'bg-[#E9EFD6] text-[#5C6B1F]'
              : 'bg-[#EFE8DC] text-[#B5A78F]')
        }
      >
        {deschis || inLucru ? SEMNE[tip] : '🔒'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">
          {titlu}
          {clic && esteExtern(url!) && (
            <span className="ml-1 text-xs font-normal text-[#8F6E2A]">↗</span>
          )}
        </span>
        {descriere && (
          <span className="mt-0.5 block text-sm text-[#5E534A]">{descriere}</span>
        )}
        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5E534A]">
          <span>{ETICHETE[tip]}</span>
          {inLucru ? (
            <span className="text-[#8F6E2A]">În pregătire</span>
          ) : !deschis ? (
            <span>Se deschide în săptămâna {saptamana}</span>
          ) : null}
        </span>
      </span>
    </>
  )

  const clase = 'flex gap-3 py-3.5'

  return (
    <li className="border-t border-[#E2D8C8] first:border-t-0">
      {clic ? (
        esteExtern(url!) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={clase + ' group hover:text-[#8F6E2A]'}
          >
            {continut}
          </a>
        ) : (
          <Link href={url!} className={clase + ' group hover:text-[#8F6E2A]'}>
            {continut}
          </Link>
        )
      ) : (
        <div className={clase + (deschis ? '' : ' opacity-60')}>{continut}</div>
      )}
    </li>
  )
}

/** Bara celor 24 de săptămâni, cu granița dintre partea intensivă și monitorizare. */
export function BaraProgres({ saptamana }: { saptamana: number }) {
  const procent = Math.min(100, Math.max(0, (saptamana / TOTAL_SAPTAMANI) * 100))
  const granita = (SAPTAMANI_INTENSIVE / TOTAL_SAPTAMANI) * 100
  return (
    <div className="mt-6">
      <div className="relative h-2 rounded-full bg-white/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#B08A3C]"
          style={{ width: `${procent}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-px bg-[#F1EAE0]/60"
          style={{ left: `${granita}%` }}
        />
      </div>
      <div className="relative mt-2 h-4 text-[0.7rem] text-[#F1EAE0]/70">
        <span className="absolute left-0 hidden sm:inline">Săpt. 1</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${granita / 2}%` }}>
          16 săptămâni intensive
        </span>
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${granita + (100 - granita) / 2}%` }}
        >
          8 de monitorizare
        </span>
      </div>
    </div>
  )
}

/** Banda adminului: vede cursul ca un cursant dintr-o anumită săptămână. */
export function BandaAdmin({
  previzualizare,
  saptamanaProprie,
  actiune,
}: {
  previzualizare: number | null
  saptamanaProprie: number
  actiune: string
}) {
  return (
    <form
      action={actiune}
      method="get"
      className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900"
    >
      <span className="font-semibold">Admin</span>
      <span>
        {previzualizare === null
          ? 'Vedeți tot cursul deschis.'
          : `Vedeți cursul ca un cursant din săptămâna ${previzualizare}.`}
      </span>
      <span className="ml-auto flex items-center gap-2">
        <label htmlFor="saptamana" className="text-amber-800">
          Previzualizare:
        </label>
        <select
          id="saptamana"
          name="saptamana"
          defaultValue={previzualizare ?? saptamanaProprie}
          className="rounded-lg border border-amber-200 bg-white px-2 py-1"
        >
          {Array.from({ length: TOTAL_SAPTAMANI }, (_, i) => i + 1).map(s => (
            <option key={s} value={s}>
              Săpt. {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white">
          Vezi
        </button>
        {previzualizare !== null && (
          <Link href={actiune} className="underline">
            Tot cursul
          </Link>
        )}
      </span>
    </form>
  )
}
