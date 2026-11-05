// Pagina de start a programului: ziua de azi, bifele ei, lecțiile cu lacăt
// pe cele care nu s-au deschis, și cele două instrumente.
//
// Ca la „Cele 7 Etape": nu cheamă getOrCreateProfile. Cine a cumpărat
// programul de somn nu e cursant în programul de 6 luni.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getProgramId,
  getModuleSomn,
  getInstrumente,
  getDate,
  ziuaCurenta,
  etichetaDeschidere,
  ZILE_PROGRAM,
} from '@/lib/resetarea-somnului'
import { ZILE, type DateJurnal, type DateTest } from '@/lib/resetarea-somnului/plan'
import FaraAcces from '@/app/cele-7-etape/FaraAcces'
import Azi from '@/components/resetarea-somnului/Azi'

export const dynamic = 'force-dynamic'

const NUME = 'Resetarea Somnului'

export default async function PaginaProgram() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <FaraAcces motiv="neautentificat" numeProgram={NUME} />

  const programId = await getProgramId(supabase)
  const module = programId ? await getModuleSomn(supabase, programId) : []
  if (!programId || module.length === 0) return <FaraAcces motiv="neinscris" numeProgram={NUME} />

  const instrumente = await getInstrumente(supabase, programId)
  const jurnal = instrumente['jurnal-21-zile']
  const test = instrumente['test-somn']
  const [dateJurnal, dateTest] = await Promise.all([
    jurnal ? getDate<DateJurnal>(supabase, jurnal.id) : null,
    test ? getDate<DateTest>(supabase, test.id) : null,
  ])

  const zi = ziuaCurenta(module)
  const incheiat = zi > ZILE_PROGRAM
  const azi = ZILE[Math.min(zi, ZILE_PROGRAM) - 1]
  const modulAzi = azi.modul ? module.find(m => m.slug === azi.modul) : null
  const incercari = dateTest?.incercari ?? []
  const zileCompletate = Object.keys(dateJurnal?.zile ?? {}).length

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
        {incheiat ? 'Program încheiat' : `Ziua ${zi} din ${ZILE_PROGRAM}`}
      </p>
      <h1 className="mt-1 font-serif text-4xl leading-tight">{NUME}</h1>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-[#E2D8C8]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ZILE_PROGRAM}
        aria-valuenow={Math.min(zi, ZILE_PROGRAM)}
        aria-label="Ziua din program"
      >
        <div
          className="h-full rounded-full bg-[#8CA032]"
          style={{ width: `${(Math.min(zi, ZILE_PROGRAM) / ZILE_PROGRAM) * 100}%` }}
        />
      </div>

      {incheiat ? (
        <section className="mt-8 rounded-xl bg-[#133D13] px-6 py-6 text-[#FBF8F2]">
          <h2 className="font-serif text-2xl">Ai parcurs cele 21 de zile.</h2>
          <p className="mt-2 text-[#D9CFBC]">
            Lecțiile, jurnalul și testul rămân deschise. Când somnul se strică din nou, te întorci la
            cele trei obiceiuri pe care le-ai ales în consolidare.
          </p>
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-[#E2D8C8] bg-[#FFFDF9] px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8F6E2A]">Azi</p>
          <h2 className="mt-1 font-serif text-2xl">{azi.titlu}</h2>
          <p className="mt-2 text-[#5E534A]">{azi.nou}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {modulAzi && (
              <Link
                href={`/resetarea-somnului/${modulAzi.slug}`}
                className="inline-flex min-h-[44px] items-center rounded-full bg-[#B08A3C] px-5 font-bold text-[#1C1713] hover:bg-[#8F6E2A] hover:text-[#FBF8F2]"
              >
                Citește lecția zilei
              </Link>
            )}
            {azi.test && (
              <Link
                href="/resetarea-somnului/test"
                className="inline-flex min-h-[44px] items-center rounded-full border border-[#CFC2AC] px-5 font-semibold hover:border-[#B08A3C]"
              >
                {zi === 1 ? 'Fă testul de pornire' : 'Refă testul de somn'}
              </Link>
            )}
          </div>

          {jurnal && (
            <div className="mt-6">
              <p className="text-sm font-semibold">Bifează ce ai făcut azi</p>
              <div className="mt-2">
                <Azi resourceId={jurnal.id} zi={zi} dateInitiale={dateJurnal ?? {}} />
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/resetarea-somnului/test"
          className="rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4 hover:border-[#B08A3C]"
        >
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8F6E2A]">
            Testul de somn
          </span>
          <span className="mt-1 block font-serif text-2xl tabular-nums">
            {incercari.length ? `${incercari[incercari.length - 1].scor} / 50` : 'Necompletat'}
          </span>
          <span className="text-sm text-[#5E534A]">
            {incercari.length > 1
              ? `Primul scor: ${incercari[0].scor}. Mai mic e mai bine.`
              : 'Se face în ziua 1 și în ziua 21.'}
          </span>
        </Link>
        <Link
          href="/resetarea-somnului/jurnal"
          className="rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4 hover:border-[#B08A3C]"
        >
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8F6E2A]">
            Jurnalul de 21 de zile
          </span>
          <span className="mt-1 block font-serif text-2xl tabular-nums">
            {zileCompletate} {zileCompletate === 1 ? 'zi' : 'zile'}
          </span>
          <span className="text-sm text-[#5E534A]">completate. Poți completa și zilele trecute.</span>
        </Link>
      </section>

      <h2 className="mt-12 font-serif text-2xl">Lecțiile</h2>
      <ol className="mt-4 space-y-px">
        {module.map(m => {
          const continut = (
            <>
              <span
                className={
                  'w-8 flex-none font-serif text-2xl leading-none ' +
                  (m.unlocked ? 'text-[#B08A3C]' : 'text-[#CFC2AC]')
                }
              >
                {m.position}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{m.title}</span>
                {m.summary && <span className="mt-0.5 block text-sm text-[#5E534A]">{m.summary}</span>}
                {!m.unlocked && (
                  <span className="mt-1 block text-xs text-[#5E534A]">{etichetaDeschidere(m.unlock_at)}</span>
                )}
              </span>
            </>
          )
          return (
            <li key={m.id} className="border-t border-[#E2D8C8] last:border-b">
              {m.unlocked ? (
                <Link href={`/resetarea-somnului/${m.slug}`} className="flex gap-4 py-4 hover:text-[#8F6E2A]">
                  {continut}
                </Link>
              ) : (
                <div className="flex gap-4 py-4 opacity-60">{continut}</div>
              )}
            </li>
          )
        })}
      </ol>

      <section className="mt-12 rounded-xl border border-[#E2D8C8] px-5 py-5">
        <h2 className="font-serif text-xl">Ai nevoie de ajutor?</h2>
        <p className="mt-2 text-sm text-[#5E534A]">
          Întrebările le aduci la întâlnirea de grup săptămânală. Dacă vrei să vorbim separat,
          programează o ședință 1:1.
        </p>
        <p className="mt-3">
          <a
            href="https://form.jotform.com/241003106754040"
            target="_blank"
            rel="noopener"
            className="font-semibold text-[#8F6E2A] underline underline-offset-4"
          >
            Programează o ședință gratuită 1:1
          </a>
        </p>
      </section>
    </>
  )
}
