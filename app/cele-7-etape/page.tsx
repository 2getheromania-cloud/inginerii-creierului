// Pagina de start a programului: cele 12 module, cu lacăt și dată pe cele
// care nu s-au deschis încă.
//
// Nu cheamă getOrCreateProfile: un cumpărător al hărții nu e cursant în
// programul de 6 luni și nu trebuie să capete rând în `profiles`. Cele două
// programe împart doar contul, nimic altceva.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getModule,
  getResurse,
  etichetaDeschidere,
  type ModulRand,
} from '@/lib/sapte-etape'
import FaraAcces from './FaraAcces'

export const dynamic = 'force-dynamic'

export default async function PaginaProgram() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <FaraAcces motiv="neautentificat" />

  const module = await getModule(supabase)
  if (module.length === 0) return <FaraAcces motiv="neinscris" />

  const resurse = await getResurse(supabase)
  const fisePeModul = new Map(
    resurse.filter(r => r.module_id).map(r => [r.module_id as string, r])
  )

  const areInstrumente = module[0].has_instruments
  const deschise = module.filter(m => m.unlocked)
  const urmatorul = module.find(m => !m.unlocked)

  return (
    <>
      <h1 className="font-serif text-3xl leading-tight">
        Cele 7 Etape ale Vindecării
      </h1>
      <p className="mt-3 text-[#5E534A]">
        {deschise.length === module.length
          ? 'Tot programul e deschis.'
          : `${deschise.length} ${deschise.length === 1 ? 'modul deschis' : 'module deschise'} din ${module.length}. ` +
            (urmatorul ? etichetaDeschidere(urmatorul.unlock_at).toLowerCase().replace('se deschide', 'Următorul se deschide') + '.' : '')}
      </p>

      {!areInstrumente && (
        <div className="mt-6 rounded-xl border border-[#B08A3C] bg-[#F6EEE2] px-5 py-4 text-sm">
          <p>
            Ai <strong>Harta</strong>. Instrumentele — cele douăsprezece fișe de
            lucru — nu sunt incluse pe treapta asta. Le vezi la fiecare modul,
            ca să știi ce sunt, dar nu se deschid.
          </p>
        </div>
      )}

      <ol className="mt-8 space-y-px">
        {module.map(m => (
          <Rand
            key={m.id}
            modul={m}
            areFisa={fisePeModul.has(m.id)}
            areInstrumente={areInstrumente}
          />
        ))}
      </ol>
    </>
  )
}

function Rand({
  modul,
  areFisa,
  areInstrumente,
}: {
  modul: ModulRand
  areFisa: boolean
  areInstrumente: boolean
}) {
  const continut = (
    <>
      <span
        className={
          'w-8 flex-none font-serif text-2xl leading-none ' +
          (modul.unlocked ? 'text-[#B08A3C]' : 'text-[#CFC2AC]')
        }
      >
        {modul.position}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">
          {modul.title}
          {modul.is_bonus && (
            <span className="ml-2 align-middle text-[0.7rem] font-bold uppercase tracking-widest text-[#8CA032]">
              bonus
            </span>
          )}
        </span>
        {modul.summary && (
          <span className="mt-0.5 block text-sm text-[#5E534A]">
            {modul.summary}
          </span>
        )}
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5E534A]">
          <span>{etichetaDeschidere(modul.unlock_at)}</span>
          {modul.instrument && (
            <span>
              {areFisa && areInstrumente ? '◆' : '🔒'} {modul.instrument}
            </span>
          )}
        </span>
      </span>
    </>
  )

  return (
    <li className="border-t border-[#E2D8C8] last:border-b">
      {modul.unlocked ? (
        <Link
          href={`/cele-7-etape/${modul.slug}`}
          className="flex gap-4 py-4 hover:text-[#8F6E2A]"
        >
          {continut}
        </Link>
      ) : (
        <div className="flex gap-4 py-4 opacity-60">{continut}</div>
      )}
    </li>
  )
}
