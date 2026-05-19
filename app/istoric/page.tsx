import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import IstoricClient from '@/components/istoric/IstoricClient'
import type { DailyReport } from '@/lib/types'

export default async function IstoricPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(90)

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Istoric & Progres</h1>
        <IstoricClient reports={(reports ?? []) as DailyReport[]} />
      </div>
    </AppShell>
  )
}
