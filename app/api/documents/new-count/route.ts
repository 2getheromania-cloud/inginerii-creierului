import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return NextResponse.json({ count: 0 })

  const since = req.nextUrl.searchParams.get('since')
  if (!since) return NextResponse.json({ count: 0 })

  const { count } = await service()
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('is_global', true)
    .gt('created_at', since)

  return NextResponse.json({ count: count ?? 0 })
}
