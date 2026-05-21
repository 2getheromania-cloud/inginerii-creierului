import { createClient } from '@/lib/supabase/server'
import { createClient as supa } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function service() {
  return supa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await service()
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
