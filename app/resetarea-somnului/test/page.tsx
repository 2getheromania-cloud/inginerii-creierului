import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProgramId, getModuleSomn, getInstrumente, getDate } from '@/lib/resetarea-somnului'
import type { DateTest } from '@/lib/resetarea-somnului/plan'
import FaraAcces from '@/app/cele-7-etape/FaraAcces'
import TestSomn from '@/components/resetarea-somnului/TestSomn'

export const dynamic = 'force-dynamic'

const NUME = 'Resetarea Somnului'

export default async function PaginaTest() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <FaraAcces motiv="neautentificat" numeProgram={NUME} />

  const programId = await getProgramId(supabase)
  const module = programId ? await getModuleSomn(supabase, programId) : []
  if (!programId || module.length === 0) return <FaraAcces motiv="neinscris" numeProgram={NUME} />

  const test = (await getInstrumente(supabase, programId))['test-somn']
  if (!test) return <FaraAcces motiv="neinscris" numeProgram={NUME} />
  const date = (await getDate<DateTest>(supabase, test.id)) ?? {}

  return (
    <>
      <Link href="/resetarea-somnului" className="text-sm font-semibold text-[#8F6E2A] hover:underline">
        ← Ziua de azi
      </Link>
      <h1 className="mt-5 font-serif text-4xl leading-tight">Testul de somn</h1>
      <TestSomn resourceId={test.id} dateInitiale={date} />
    </>
  )
}
