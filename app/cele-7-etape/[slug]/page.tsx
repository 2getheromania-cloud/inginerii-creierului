// Un modul: lecțiile lui și fișa de lucru.
//
// Nu verificăm aici dacă modulul s-a deschis. Verificarea e în RLS: pe un modul
// nedeschis lista de lecții vine goală, oricât ar insista cineva cu slug-ul în
// bară. Codul paginii nu poate ocoli regula, pentru că serverul nu primește
// rândurile — ceea ce e tot ce contează când id-ul unui clip Vimeo e cheia.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getModule,
  getLectii,
  getResurse,
  getProgres,
  etichetaDeschidere,
} from '@/lib/sapte-etape'
import FaraAcces from '../FaraAcces'
import Lectii from './Lectii'

export const dynamic = 'force-dynamic'

export default async function PaginaModul({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <FaraAcces motiv="neautentificat" />

  const module = await getModule(supabase)
  if (module.length === 0) return <FaraAcces motiv="neinscris" />

  const modul = module.find(m => m.slug === params.slug)
  if (!modul) notFound()

  const [lectii, resurse, vazute] = await Promise.all([
    getLectii(supabase, modul.id),
    getResurse(supabase),
    getProgres(supabase),
  ])

  const fisa = resurse.find(r => r.module_id === modul.id) ?? null
  const anterior = module.find(m => m.position === modul.position - 1)
  const urmator = module.find(m => m.position === modul.position + 1)

  return (
    <>
      <Link
        href="/cele-7-etape"
        className="text-sm font-semibold text-[#8F6E2A] hover:underline"
      >
        ← Toate modulele
      </Link>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
        Modulul {modul.position}
      </p>
      <h1 className="mt-1 font-serif text-3xl leading-tight">{modul.title}</h1>
      {modul.summary && <p className="mt-3 text-[#5E534A]">{modul.summary}</p>}

      {!modul.unlocked && (
        <p className="mt-6 rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4">
          {etichetaDeschidere(modul.unlock_at)}.
        </p>
      )}

      <Lectii lectii={lectii} vazuteInitial={Array.from(vazute)} />

      {modul.instrument && (
        <section className="mt-10 rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8F6E2A]">
            Instrumentul modulului
          </p>
          <h2 className="mt-2 font-serif text-xl">{modul.instrument}</h2>

          {fisa ? (
            <p className="mt-3">
              <Link
                href={
                  fisa.path && fisa.path.startsWith('http')
                    ? fisa.path
                    : `/cele-7-etape/fise/${fisa.slug}`
                }
                className="font-semibold text-[#8F6E2A] underline underline-offset-4"
              >
                Deschide fișa
              </Link>
            </p>
          ) : modul.has_instruments ? (
            <p className="mt-3 text-sm text-[#5E534A]">
              Fișa se deschide odată cu modulul.
            </p>
          ) : (
            <p className="mt-3 text-sm text-[#5E534A]">
              Fișele fac parte din treapta „Harta + Instrumente". Pe treapta ta
              ai lecțiile, nu și instrumentele de lucru.
            </p>
          )}
        </section>
      )}

      <nav className="mt-10 flex justify-between gap-4 border-t border-[#E2D8C8] pt-5 text-sm">
        {anterior?.unlocked ? (
          <Link
            href={`/cele-7-etape/${anterior.slug}`}
            className="font-semibold text-[#8F6E2A] hover:underline"
          >
            ← {anterior.title}
          </Link>
        ) : (
          <span />
        )}
        {urmator?.unlocked ? (
          <Link
            href={`/cele-7-etape/${urmator.slug}`}
            className="text-right font-semibold text-[#8F6E2A] hover:underline"
          >
            {urmator.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}
