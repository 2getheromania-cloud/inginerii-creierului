'use client'

// Testul de somn: zece întrebări, 0–5 fiecare, scor 0–50.
// Fiecare completare se adaugă la istoric; prima și ultima se compară.

import { useState } from 'react'
import {
  INTREBARI_TEST,
  interpretare,
  type DateTest,
  type Incercare,
} from '@/lib/resetarea-somnului/plan'
import { salveaza } from './salvare'

const ETICHETE = ['niciodată', '', '', '', '', 'foarte des']

export default function TestSomn({
  resourceId,
  dateInitiale,
}: {
  resourceId: string
  dateInitiale: DateTest
}) {
  const [istoric, setIstoric] = useState<Incercare[]>(dateInitiale.incercari ?? [])
  const [r, setR] = useState<(number | null)[]>(Array(INTREBARI_TEST.length).fill(null))
  const [eroare, setEroare] = useState<string | null>(null)
  const [salvez, setSalvez] = useState(false)
  const [rezultat, setRezultat] = useState<Incercare | null>(null)

  const completate = r.filter(x => x !== null).length
  const scor = r.reduce<number>((a, b) => a + (b ?? 0), 0)

  async function trimite() {
    if (completate < INTREBARI_TEST.length) return
    setSalvez(true)
    setEroare(null)
    const noua: Incercare = { data: new Date().toISOString(), scor, r: r as number[] }
    const urmator = [...istoric, noua]
    const err = await salveaza(resourceId, { incercari: urmator })
    setSalvez(false)
    if (err) return setEroare(err)
    setIstoric(urmator)
    setRezultat(noua)
    setR(Array(INTREBARI_TEST.length).fill(null))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prima = istoric[0]
  const ultima = istoric[istoric.length - 1]

  return (
    <>
      {rezultat && <Rezultat incercare={rezultat} prima={istoric.length > 1 ? prima : null} />}

      {!rezultat && istoric.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4 text-sm">
          Ultimul scor: <strong className="tabular-nums">{ultima.scor}</strong> din 50, pe{' '}
          {new Date(ultima.data).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}.
          {istoric.length > 1 && (
            <> Primul: <strong className="tabular-nums">{prima.scor}</strong>.</>
          )}
        </div>
      )}

      <p className="mt-6 text-[#5E534A]">
        Gândește-te la ultimele trei-patru nopți. Pentru fiecare afirmație alege cât de des ți se
        întâmplă: 0 înseamnă niciodată, 5 înseamnă foarte des.
      </p>

      <ol className="mt-6 space-y-px">
        {INTREBARI_TEST.map((q, i) => (
          <li key={i} className="border-t border-[#E2D8C8] py-4 last:border-b">
            <fieldset>
              <legend className="font-semibold">
                <span className="mr-2 font-serif text-xl text-[#B08A3C] tabular-nums">{i + 1}</span>
                {q}
              </legend>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setR(prev => prev.map((x, j) => (j === i ? v : x)))}
                    aria-pressed={r[i] === v}
                    aria-label={`${v}${ETICHETE[v] ? ', ' + ETICHETE[v] : ''}`}
                    className={
                      'h-11 w-11 rounded-lg border text-sm font-semibold tabular-nums ' +
                      (r[i] === v
                        ? 'border-[#133D13] bg-[#133D13] text-[#FBF8F2]'
                        : 'border-[#CFC2AC] bg-white hover:border-[#B08A3C]')
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {eroare && (
        <p className="mt-4 rounded-lg border border-[#B08A3C] bg-[#F6EEE2] px-4 py-2 text-sm">{eroare}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={trimite}
          disabled={completate < INTREBARI_TEST.length || salvez}
          className="min-h-[48px] rounded-full bg-[#B08A3C] px-6 font-bold text-[#1C1713] hover:bg-[#8F6E2A] hover:text-[#FBF8F2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvez ? 'Se salvează…' : 'Vezi scorul'}
        </button>
        <span className="text-sm text-[#5E534A] tabular-nums">
          {completate} din {INTREBARI_TEST.length} completate
        </span>
      </div>

      <p className="mt-8 text-xs text-[#5E534A]">
        Testul e un instrument de urmărire din Ghidul Somnului, nu un test validat științific. Arată
        dacă te miști în cele 21 de zile; nu pune un diagnostic. Se salvează scorul și răspunsurile
        tale, în contul tău.
      </p>
    </>
  )
}

function Rezultat({ incercare, prima }: { incercare: Incercare; prima: Incercare | null }) {
  const { titlu, text } = interpretare(incercare.scor)
  const dif = prima ? prima.scor - incercare.scor : 0
  return (
    <section className="mt-6 rounded-xl bg-[#133D13] px-6 py-6 text-[#FBF8F2]" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D2AD5C]">Scorul tău</p>
      <p className="mt-1 font-serif text-5xl tabular-nums">
        {incercare.scor}
        <span className="text-2xl text-[#D9CFBC]"> / 50</span>
      </p>
      <p className="mt-3 font-semibold">{titlu}</p>
      <p className="mt-1 text-[#D9CFBC]">{text}</p>
      {prima && (
        <p className="mt-4 border-t border-white/15 pt-4 text-sm">
          La primul test aveai <strong className="tabular-nums">{prima.scor}</strong>.{' '}
          {dif > 0
            ? `Ai coborât cu ${dif} ${dif === 1 ? 'punct' : 'puncte'}. Scor mai mic înseamnă somn mai bun.`
            : dif < 0
            ? 'Scorul a crescut. Merită discutat la întâlnirea de grup sau cu medicul.'
            : 'Scorul e la fel.'}
        </p>
      )}
    </section>
  )
}
