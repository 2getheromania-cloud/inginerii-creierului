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
    'Pasi', 'Apa_ml', 'Miscare', 'Meditatie',
    'MD_Proteina', 'MD_Legume', 'MD_Grasimi', 'MD_Apa', 'MD_Suplimente', 'MD_Reteta', 'MD_Reteta_Aleasa', 'MD_Modificari',
    'Pranz_Proteina', 'Pranz_Legume', 'Pranz_Grasimi', 'Pranz_Apa', 'Pranz_Suplimente', 'Pranz_Reteta', 'Pranz_Reteta_Aleasa', 'Pranz_Modificari',
    'Cina_Proteina', 'Cina_Legume', 'Cina_Grasimi', 'Cina_Apa', 'Cina_Suplimente', 'Cina_Reteta', 'Cina_Reteta_Aleasa', 'Cina_Modificari',
    'Simptome',
  ].join(',')

  const rows = (reports ?? []).map((r: DailyReport & { profiles: { name: string; email: string; week: number } }) => {
    const pct = calcCompletionPct(r.checks as unknown as Record<string, unknown>)
    const s = r.sliders
    const c = r.checks
    const symptomsStr = r.symptoms.map(x => `${x.name}(${x.severity})`).join('; ')

    function mealCols(meal: typeof c.breakfast) {
      return [
        meal.protein ? 1 : 0,
        meal.vegetables ? 1 : 0,
        meal.fats ? 1 : 0,
        meal.water ? 1 : 0,
        meal.supplements ? 1 : 0,
        meal.recipe ? 1 : 0,
        `"${(meal.recipe_name ?? '').replace(/"/g, '""')}"`,
        `"${(meal.recipe_note ?? '').replace(/"/g, '""')}"`,
      ]
    }

    return [
      r.date,
      `"${(r.profiles?.name ?? '').replace(/"/g, '""')}"`,
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
      ...mealCols(c.breakfast),
      ...mealCols(c.lunch),
      ...mealCols(c.dinner),
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
