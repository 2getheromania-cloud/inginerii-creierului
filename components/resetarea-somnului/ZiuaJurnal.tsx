'use client'

// O zi din jurnal: bifele obiceiurilor zilei și trei cifre.
// Se salvează singur, la o secundă după ultima schimbare.

import { useEffect, useRef, useState } from 'react'
import { obiceiuriPentru, type DateJurnal, type IntrareZi } from '@/lib/resetarea-somnului/plan'
import { salveaza } from './salvare'

export default function ZiuaJurnal({
  resourceId,
  zi,
  date,
  onChange,
}: {
  resourceId: string
  zi: number
  date: DateJurnal
  onChange: (d: DateJurnal) => void
}) {
  const intrare: IntrareZi = date.zile?.[String(zi)] ?? {}
  const obiceiuri = obiceiuriPentru(zi)
  const [stare, setStare] = useState<'gol' | 'salvez' | 'salvat' | string>('gol')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultima = useRef<DateJurnal>(date)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function schimba(nou: IntrareZi) {
    const urmatoare: DateJurnal = { zile: { ...(date.zile ?? {}), [String(zi)]: nou } }
    ultima.current = urmatoare
    onChange(urmatoare)
    setStare('salvez')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const err = await salveaza(resourceId, ultima.current)
      setStare(err ?? 'salvat')
    }, 900)
  }

  function comuta(id: string) {
    const b = new Set(intrare.b ?? [])
    if (b.has(id)) b.delete(id)
    else b.add(id)
    schimba({ ...intrare, b: Array.from(b) })
  }

  const bifate = new Set(intrare.b ?? [])

  return (
    <div>
      <ul className="space-y-px">
        {obiceiuri.map(o => (
          <li key={o.id} className="border-t border-[#E2D8C8] last:border-b">
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-3">
              <input
                type="checkbox"
                checked={bifate.has(o.id)}
                onChange={() => comuta(o.id)}
                className="mt-1 h-5 w-5 flex-none accent-[#8CA032]"
              />
              <span className={bifate.has(o.id) ? 'text-[#5E534A] line-through decoration-[#CFC2AC]' : ''}>
                {o.text}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Scala
          eticheta="Cum am dormit azi-noapte"
          valoare={intrare.somn}
          onAlege={v => schimba({ ...intrare, somn: v })}
        />
        <Scala
          eticheta="Energia de azi"
          valoare={intrare.energie}
          onAlege={v => schimba({ ...intrare, energie: v })}
        />
        <label className="block">
          <span className="block text-sm font-semibold">Ora trezirii</span>
          <input
            type="time"
            value={intrare.trezire ?? ''}
            onChange={e => schimba({ ...intrare, trezire: e.target.value || undefined })}
            className="mt-2 h-11 w-full max-w-[244px] rounded-lg border border-[#CFC2AC] bg-white px-3 tabular-nums"
          />
        </label>
      </div>

      <p className="mt-4 h-5 text-xs text-[#5E534A]" aria-live="polite">
        {stare === 'salvez' ? 'Se salvează…' : stare === 'salvat' ? 'Salvat în cont.' : stare === 'gol' ? '' : stare}
      </p>
    </div>
  )
}

function Scala({
  eticheta,
  valoare,
  onAlege,
}: {
  eticheta: string
  valoare?: number
  onAlege: (v: number) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{eticheta}</legend>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onAlege(v)}
            aria-pressed={valoare === v}
            aria-label={`${eticheta}: ${v} din 5`}
            className={
              'h-11 w-11 rounded-lg border text-sm font-semibold tabular-nums ' +
              (valoare === v
                ? 'border-[#133D13] bg-[#133D13] text-[#FBF8F2]'
                : 'border-[#CFC2AC] bg-white hover:border-[#B08A3C]')
            }
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-1 flex max-w-[244px] justify-between text-[0.7rem] text-[#5E534A]">
        <span>prost</span>
        <span>foarte bine</span>
      </div>
    </fieldset>
  )
}
