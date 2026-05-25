import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Returns total count of global documents — client compares with last-seen count in localStorage
export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return NextResponse.json({ count: 0 })

  const { count } = await service()
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('is_global', true)

  return NextResponse.json({ count: count ?? 0 })
}
