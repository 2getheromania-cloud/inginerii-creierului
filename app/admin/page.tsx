import { createClient } from '@/lib/supabase/server'
import { getOrCreateProfile } from '@/lib/supabase/profile'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import AdminCursantiClient from '@/components/admin/AdminCursantiClient'
import type { AdminStats } from '@/lib/types'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const profile = await getOrCreateProfile(user.id, user.email!)
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: stats } = await supabase.from('admin_stats').select('*').order('created_at', { ascending: false })
  const cursanti = (stats ?? []) as AdminStats[]

  const today         = new Date().toISOString().split('T')[0]
  const totalCursanti = cursanti.length
  const activeToday   = cursanti.filter(c => c.last_report_date === today).length
  const inactive3Plus = cursanti.filter(c => (c.days_since_report ?? 99) >= 3).length

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/administratori" className="btn-secondary text-sm">Administratori</Link>
            <Link href="/admin/notificari"     className="btn-secondary text-sm">Notificări</Link>
            <Link href="/admin/rapoarte"       className="btn-secondary text-sm">Export CSV</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total cursanți',   value: totalCursanti,  color: 'text-gray-900' },
            { label: 'Activi azi',       value: activeToday,    color: 'text-brand-600' },
            { label: 'Inactivi 3+ zile', value: inactive3Plus,  color: 'text-red-600' },
            { label: 'Rată completare',  value: `${Math.round((activeToday / (totalCursanti || 1)) * 100)}%`, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {inactive3Plus > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="font-semibold text-red-700 mb-2">
              ⚠️ {inactive3Plus} cursant(ți) nu au raportat în ultimele 3+ zile
            </p>
            <div className="flex flex-wrap gap-2">
              {cursanti.filter(c => (c.days_since_report ?? 99) >= 3).map(c => (
                <Link key={c.id} href={`/admin/cursant/${c.id}`} className="text-sm text-red-700 hover:underline font-medium">
                  {c.name || c.email}
                </Link>
              ))}
            </div>
          </div>
        )}

        <AdminCursantiClient cursanti={cursanti} total={totalCursanti} />
      </div>
    </AppShell>
  )
}
