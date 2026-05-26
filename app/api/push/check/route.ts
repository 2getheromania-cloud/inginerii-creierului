import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Returns whether the given push endpoint is still registered in DB for this user.
// Used to detect stale subscriptions (deleted after 410 errors).
export async function GET(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ found: false })

  const endpoint = req.nextUrl.searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ found: false })

  const { count } = await service()
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  return NextResponse.json({ found: (count ?? 0) > 0 })
}
