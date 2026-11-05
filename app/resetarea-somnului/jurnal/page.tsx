import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getProgramId,
  getModuleSomn,
  getInstrumente,
  getDate,
  ziuaCurenta,
} from '@/lib/resetarea-somnului'
import type { DateJurnal } from '@/lib/resetarea-somnului/plan'
import FaraAcces from '@/app/cele-7-etape/FaraAcces'
import Jurnal from '@/components/resetarea-somnului/Jurnal'

export const dynamic = 'force-dynamic'

const NUME = 'Resetarea Somnului'

export default async function PaginaJurnal() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <FaraAcces motiv="neautentificat" numeProgram={NUME} />

  const programId = await getProgramId(supabase)
  const module = programId ? await getModuleSomn(supabase, programId) : []
  if (!programId || module.length === 0) return <FaraAcces motiv="neinscris" numeProgram={NUME} />

  const jurnal = (await getInstrumente(supabase, programId))['jurnal-21-zile']
  if (!jurnal) return <FaraAcces motiv="neinscris" numeProgram={NUME} />
  const date = (await getDate<DateJurnal>(supabase, jurnal.id)) ?? {}

  return (
    <>
      <Link href="/resetarea-somnului" className="text-sm font-semibold text-[#8F6E2A] hover:underline">
        ← Ziua de azi
      </Link>
      <h1 className="mt-5 font-serif text-4xl leading-tight">Jurnalul de 21 de zile</h1>
      <p className="mt-3 text-[#5E534A]">
        Două minute pe zi, dimineața. Se salvează doar bifele și cifrele. Reflecțiile din lecții le
        scrii în caiet: ele nu se salvează nicăieri.
      </p>
      <div className="mt-6">
        <Jurnal resourceId={jurnal.id} ziCurenta={ziuaCurenta(module)} dateInitiale={date} />
      </div>
    </>
  )
}
