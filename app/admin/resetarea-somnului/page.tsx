// Adminul programului „Resetarea Somnului": cine e înscris, în ce zi e,
// cum a evoluat testul și cât de des completează jurnalul.
//
// Cursanții își văd doar rândurile lor (RLS). Adminul trebuie să-i vadă pe
// toți, deci citirea se face cu cheia de service, DUPĂ ce s-a verificat aici
// că omul conectat are rol de admin. Cheia nu ajunge niciodată în browser.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import AppShell from '@/components/layout/AppShell'
import { PROGRAM_SLUG, ZILE_PROGRAM } from '@/lib/resetarea-somnului'
import { obiceiuriPentru, type DateJurnal, type DateTest } from '@/lib/resetarea-somnului/plan'

export const dynamic = 'force-dynamic'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function ziua(enrolledAt: string, now = new Date()): number {
  const z = (d: Date) => {
    const [y, m, day] = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' }).split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.floor((z(now) - z(new Date(enrolledAt))) / 86_400_000) + 1
}

type Rand = {
  userId: string
  email: string
  enrolledAt: string
  status: string
  test: boolean
  zi: number
  testPrim: number | null
  testUltim: number | null
  zileJurnal: number
  procentBife: number | null
  somnMediu: number | null
  ultimaActivitate: string | null
}

export default async function AdminResetareaSomnului() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const db = service()
  const { data: program } = await db.from('programs').select('id').eq('slug', PROGRAM_SLUG).single()
  if (!program) {
    return (
      <AppShell profile={profile}>
        <p>Programul nu există în bază. Rulează migrația 20261105_resetarea_somnului.sql.</p>
      </AppShell>
    )
  }

  const [{ data: enrollments }, { data: resurse }] = await Promise.all([
    db
      .from('enrollments')
      .select('user_id, enrolled_at, status, stripe_session_id')
      .eq('program_id', program.id)
      .order('enrolled_at', { ascending: false }),
    db.from('resources').select('id, slug').eq('program_id', program.id),
  ])

  const idTest = resurse?.find(r => r.slug === 'test-somn')?.id
  const idJurnal = resurse?.find(r => r.slug === 'jurnal-21-zile')?.id
  const userIds = (enrollments ?? []).map(e => e.user_id as string)

  const { data: intrari } = userIds.length
    ? await db
        .from('resource_entries')
        .select('user_id, resource_id, data, updated_at')
        .in('user_id', userIds)
        .in('resource_id', [idTest, idJurnal].filter(Boolean) as string[])
    : { data: [] as { user_id: string; resource_id: string; data: unknown; updated_at: string }[] }

  // Adresele de email stau în auth.users; se citesc prin API-ul de admin.
  const emailuri = new Map<string, string>()
  await Promise.all(
    userIds.map(async id => {
      const { data } = await db.auth.admin.getUserById(id)
      if (data?.user?.email) emailuri.set(id, data.user.email)
    })
  )

  const randuri: Rand[] = (enrollments ?? []).map(e => {
    const uid = e.user_id as string
    const mele = (intrari ?? []).filter(i => i.user_id === uid)
    const t = mele.find(i => i.resource_id === idTest)
    const j = mele.find(i => i.resource_id === idJurnal)
    const incercari = (t?.data as DateTest | undefined)?.incercari ?? []
    const zile = (j?.data as DateJurnal | undefined)?.zile ?? {}
    const zi = ziua(e.enrolled_at as string)

    let bifate = 0
    let posibile = 0
    const note: number[] = []
    for (const [k, v] of Object.entries(zile)) {
      bifate += v.b?.length ?? 0
      posibile += obiceiuriPentru(Number(k)).length
      if (typeof v.somn === 'number') note.push(v.somn)
    }
    const activitate = [t?.updated_at, j?.updated_at].filter(Boolean).sort().pop() ?? null

    return {
      userId: uid,
      email: emailuri.get(uid) ?? uid.slice(0, 8),
      enrolledAt: e.enrolled_at as string,
      status: e.status as string,
      test: !e.stripe_session_id,
      zi,
      testPrim: incercari[0]?.scor ?? null,
      testUltim: incercari.length > 1 ? incercari[incercari.length - 1].scor : null,
      zileJurnal: Object.keys(zile).length,
      procentBife: posibile ? Math.round((bifate / posibile) * 100) : null,
      somnMediu: note.length ? note.reduce((a, b) => a + b, 0) / note.length : null,
      ultimaActivitate: activitate as string | null,
    }
  })

  const activi = randuri.filter(r => r.status === 'active')
  const inProgram = activi.filter(r => r.zi <= ZILE_PROGRAM).length
  const cuTest = activi.filter(r => r.testPrim !== null).length
  const scaderi = activi
    .filter(r => r.testPrim !== null && r.testUltim !== null)
    .map(r => (r.testPrim as number) - (r.testUltim as number))
  const dataRo = (d: string) =>
    new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'Europe/Bucharest' })

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Dashboard admin</Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Resetarea Somnului</h1>
          </div>
          <Link href="/resetarea-somnului" className="btn-secondary text-sm">
            Deschide programul ca cursant
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Înscriși activi', value: activi.length },
            { label: 'În cele 21 de zile', value: inProgram },
            { label: 'Au făcut testul', value: cuTest },
            {
              label: 'Scădere medie a scorului',
              value: scaderi.length
                ? (scaderi.reduce((a, b) => a + b, 0) / scaderi.length).toFixed(1).replace('.', ',')
                : '—',
            },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-gray-900 tabular-nums">{s.value}</div>
              <div className="mt-1 text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Cursant</th>
                <th className="px-4 py-3">Înscris</th>
                <th className="px-4 py-3">Ziua</th>
                <th className="px-4 py-3">Test 1 → ultim</th>
                <th className="px-4 py-3">Jurnal</th>
                <th className="px-4 py-3">Obiceiuri bifate</th>
                <th className="px-4 py-3">Somn mediu</th>
                <th className="px-4 py-3">Ultima activitate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {randuri.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Încă nu s-a înscris nimeni.
                  </td>
                </tr>
              )}
              {randuri.map(r => (
                <tr key={r.userId} className={r.status === 'active' ? '' : 'opacity-50'}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.email}</div>
                    <div className="text-xs text-gray-500">
                      {r.status !== 'active' ? r.status : r.test ? 'înscriere de test' : 'plătit prin Stripe'}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{dataRo(r.enrolledAt)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.zi > ZILE_PROGRAM ? 'încheiat' : `${r.zi} / ${ZILE_PROGRAM}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.testPrim === null ? '—' : r.testUltim === null ? r.testPrim : `${r.testPrim} → ${r.testUltim}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.zileJurnal} zile</td>
                  <td className="px-4 py-3 tabular-nums">{r.procentBife === null ? '—' : `${r.procentBife}%`}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.somnMediu === null ? '—' : `${r.somnMediu.toFixed(1).replace('.', ',')} / 5`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.ultimaActivitate ? dataRo(r.ultimaActivitate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          Scorul testului e 0–50; mai mic înseamnă somn mai bun. Reflecțiile cursanților nu se salvează,
          deci nu apar aici.
        </p>
      </div>
    </AppShell>
  )
}
