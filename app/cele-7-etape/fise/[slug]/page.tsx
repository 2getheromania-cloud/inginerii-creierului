// O fișă de lucru, citită în aplicație.
//
// Accesul se decide într-o singură interogare: `resources` are RLS, iar
// politica cere deodată înscriere activă, modulul deschis și treapta plătită.
// Dacă rândul nu vine, fișa nu există pentru omul acesta — 404, nu un mesaj
// care i-ar confirma exact ce ratează.
//
// Textul fișei stă în lib/fise, ca module TypeScript, nu în public/: acolo ar
// fi accesibil oricui nimerește adresa, iar unsprezece din douăsprezece se dau
// numai pe treapta cu instrumente.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFisa, faraAntet } from '@/lib/fise'
import { stilFise } from '@/lib/fise/stil'

export const dynamic = 'force-dynamic'

export default async function PaginaFisa({
  params,
}: {
  params: { slug: string }
}) {
  const fisa = getFisa(params.slug)
  if (!fisa) notFound()

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: resursa } = await supabase
    .from('resources')
    .select('id, slug, title, saves_answers')
    .eq('slug', params.slug)
    // limit(1): slug-ul e unic pe program, iar programe sunt mai multe în
    // aceeași bază. Fără el, o a doua ediție cu aceeași fișă ar face
    // maybeSingle să arunce, nu să aleagă.
    .limit(1)
    .maybeSingle()

  if (!resursa) notFound()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stilFise }} />

      <Link
        href="/cele-7-etape"
        className="text-sm font-semibold text-[#8F6E2A] hover:underline"
      >
        ← Toate modulele
      </Link>

      <h1 className="mt-5 font-serif text-3xl leading-tight">{fisa.titlu}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[#E2D8C8] py-3 text-sm">
        <a
          href={`/cele-7-etape/fise/${params.slug}/tiparire`}
          target="_blank"
          rel="noopener"
          className="font-semibold text-[#8F6E2A] underline underline-offset-4"
        >
          Deschide pentru tipărit
        </a>
        <span className="text-[#5E534A]">
          {resursa.saves_answers
            ? 'Completarea pe ecran vine odată cu formularul acestui modul.'
            : 'Fișa asta nu se salvează nicăieri. E a ta.'}
        </span>
      </div>

      <div
        className="fisa-in-aplicatie"
        dangerouslySetInnerHTML={{ __html: faraAntet(fisa.corp) }}
      />
    </>
  )
}
