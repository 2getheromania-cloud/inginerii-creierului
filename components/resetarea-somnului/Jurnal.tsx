'use client'

// Jurnalul complet: cele 21 de zile într-o grilă, plus completarea oricărei
// zile care a trecut. Zilele viitoare nu se pot completa.

import { useState } from 'react'
import { obiceiuriPentru, ZILE, type DateJurnal } from '@/lib/resetarea-somnului/plan'
import ZiuaJurnal from './ZiuaJurnal'

export default function Jurnal({
  resourceId,
  ziCurenta,
  dateInitiale,
}: {
  resourceId: string
  ziCurenta: number
  dateInitiale: DateJurnal
}) {
  const [date, setDate] = useState<DateJurnal>(dateInitiale)
  const ultima = Math.min(ziCurenta, 21)
  const [aleasa, setAleasa] = useState(ultima)

  const procent = (zi: number) => {
    const total = obiceiuriPentru(zi).length
    const b = date.zile?.[String(zi)]?.b?.length ?? 0
    return total ? b / total : 0
  }

  const zileCuSomn = Object.values(date.zile ?? {}).filter(z => z.somn)
  const medie = (cheie: 'somn' | 'energie', de: number, pana: number) => {
    const v = Object.entries(date.zile ?? {})
      .filter(([k]) => Number(k) >= de && Number(k) <= pana)
      .map(([, z]) => z[cheie])
      .filter((x): x is number => typeof x === 'number')
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).replace('.', ',') : '—'
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Cele 21 de zile">
        {ZILE.map(z => {
          const p = procent(z.zi)
          const viitoare = z.zi > ultima
          return (
            <button
              key={z.zi}
              type="button"
              role="listitem"
              disabled={viitoare}
              onClick={() => setAleasa(z.zi)}
              aria-current={aleasa === z.zi ? 'true' : undefined}
              aria-label={`Ziua ${z.zi}${viitoare ? ', încă nu a venit' : `, ${Math.round(p * 100)}% din obiceiuri`}`}
              className={
                'flex aspect-square min-h-[40px] flex-col items-center justify-center rounded-lg border text-sm font-semibold tabular-nums ' +
                (aleasa === z.zi ? 'ring-2 ring-[#B08A3C] ring-offset-1 ' : '') +
                (viitoare
                  ? 'border-[#E2D8C8] text-[#CFC2AC]'
                  : p >= 0.8
                  ? 'border-[#133D13] bg-[#133D13] text-[#FBF8F2]'
                  : p >= 0.4
                  ? 'border-[#8CA032] bg-[#E4EBD3] text-[#2F4A12]'
                  : p > 0
                  ? 'border-[#CFC2AC] bg-[#F3EDE2]'
                  : 'border-[#CFC2AC] bg-white')
              }
            >
              {z.zi}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-[#5E534A]">
        Verde închis: peste 80% din obiceiurile zilei. Verde deschis: peste 40%.
      </p>

      {zileCuSomn.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ['Zilele 1–7', 1, 7],
            ['Zilele 8–17', 8, 17],
            ['Zilele 18–21', 18, 21],
          ].map(([t, de, pana]) => (
            <div key={t as string} className="rounded-xl border border-[#E2D8C8] bg-white px-2 py-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#8F6E2A]">{t}</p>
              <p className="mt-1 font-serif text-2xl tabular-nums">{medie('somn', de as number, pana as number)}</p>
              <p className="text-xs text-[#5E534A]">somn, media din 5</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-8 rounded-xl border border-[#E2D8C8] bg-[#FFFDF9] px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">Ziua {aleasa}</p>
        <h2 className="mt-1 font-serif text-2xl">{ZILE[aleasa - 1].titlu}</h2>
        <div className="mt-4">
          <ZiuaJurnal key={aleasa} resourceId={resourceId} zi={aleasa} date={date} onChange={setDate} />
        </div>
      </section>
    </>
  )
}
