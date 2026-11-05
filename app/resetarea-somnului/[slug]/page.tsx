// O lecție a programului de somn.
//
// Accesul: modulul trebuie să vină din my_modules (înscriere activă) și să fie
// deschis. Textul stă în lib/resetarea-somnului/lectii.ts și se trimite doar
// după verificare. Dacă modulul are și clipuri în `lessons`, apar deasupra,
// cu același player ca la „Cele 7 Etape" (RLS le filtrează pe cele nedeschise).

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getProgramId,
  getModuleSomn,
  etichetaDeschidere,
} from '@/lib/resetarea-somnului'
import { getLectii, getProgres } from '@/lib/sapte-etape'
import { LECTII } from '@/lib/resetarea-somnului/lectii'
import { stilLectii } from '@/lib/resetarea-somnului/stil'
import FaraAcces from '@/app/cele-7-etape/FaraAcces'
import Lectii from '@/app/cele-7-etape/[slug]/Lectii'

export const dynamic = 'force-dynamic'

const NUME = 'Resetarea Somnului'

export default async function PaginaLectie({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <FaraAcces motiv="neautentificat" numeProgram={NUME} />

  const programId = await getProgramId(supabase)
  const module = programId ? await getModuleSomn(supabase, programId) : []
  if (module.length === 0) return <FaraAcces motiv="neinscris" numeProgram={NUME} />

  const modul = module.find(m => m.slug === params.slug)
  if (!modul) notFound()

  const anterior = module.find(m => m.position === modul.position - 1)
  const urmator = module.find(m => m.position === modul.position + 1)

  const inapoi = (
    <Link href="/resetarea-somnului" className="text-sm font-semibold text-[#8F6E2A] hover:underline">
      ← Ziua de azi
    </Link>
  )

  if (!modul.unlocked) {
    return (
      <>
        {inapoi}
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
          Lecția {modul.position}
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight">{modul.title}</h1>
        <p className="mt-6 rounded-xl border border-[#E2D8C8] bg-[#F3EDE2] px-5 py-4">
          {etichetaDeschidere(modul.unlock_at)}. Lecțiile se deschid câte una pe zi, ca să ai timp
          să încerci fiecare obicei înainte de următorul.
        </p>
      </>
    )
  }

  const [clipuri, vazute] = await Promise.all([getLectii(supabase, modul.id), getProgres(supabase)])
  const corp = LECTII[modul.slug] ?? ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stilLectii }} />
      {inapoi}

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#B08A3C]">
        Lecția {modul.position}
      </p>
      <h1 className="mt-1 font-serif text-4xl leading-tight">{modul.title}</h1>

      {clipuri.length > 0 && <Lectii lectii={clipuri} vazuteInitial={Array.from(vazute)} />}

      <article className="lectie-somn" dangerouslySetInnerHTML={{ __html: corp }} />

      <nav className="mt-12 flex justify-between gap-4 border-t border-[#E2D8C8] pt-5 text-sm">
        {anterior?.unlocked ? (
          <Link href={`/resetarea-somnului/${anterior.slug}`} className="font-semibold text-[#8F6E2A] hover:underline">
            ← {anterior.title}
          </Link>
        ) : (
          <span />
        )}
        {urmator?.unlocked ? (
          <Link
            href={`/resetarea-somnului/${urmator.slug}`}
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
