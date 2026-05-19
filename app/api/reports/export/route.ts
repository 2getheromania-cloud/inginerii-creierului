import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calcCompletionPct } from '@/lib/utils'
import type { DailyReport } from '@/lib/types'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')

  let query = service
    .from('daily_reports')
    .select('*, profiles(name, email, week)')
    .order('date', { ascending: false })

  if (userId) query = query.eq('user_id', userId)
  if (from)   query = query.gte('date', from)
  if (to)     query = query.lte('date', to)

  const { data: reports, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = [
    'Data', 'Cursant', 'Email', 'Sapt', 'Completare%',
    'Energie', 'Somn', 'Stres', 'Stare_generala', 'Productivitate',
    'Pasi', 'Apa_ml', 'Miscare', 'Meditatie', 'Simptome',
  ].join(',')

  const rows = (reports ?? []).map((r: DailyReport & { profiles: { name: string; email: string; week: number } }) => {
    const pct = calcCompletionPct(r.checks as unknown as Record<string, unknown>)
    const s = r.sliders
    const c = r.checks
    const symptomsStr = r.symptoms.map(x => `${x.name}(${x.severity})`).join('; ')
    return [
      r.date,
      `"${r.profiles?.name ?? ''}"`,
      r.profiles?.email ?? '',
      r.profiles?.week ?? '',
      pct,
      s.energie ?? '',
      s.somn ?? '',
      s.stres ?? '',
      s.stare_generala ?? '',
      s.productivitate ?? '',
      c.steps ?? 0,
      c.total_water_ml ?? 0,
      c.movement ? 1 : 0,
      c.meditation ? 1 : 0,
      `"${symptomsStr}"`,
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rapoarte_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
