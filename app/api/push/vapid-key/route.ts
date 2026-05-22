import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Public VAPID key — safe to embed in source (not a secret)
const VAPID_PUBLIC_KEY = 'BKy69Ol32MtmlhW3KyuedEAunYX28zlyqpHiWgRKuNjsih1yb9pOwUpYrIpCX4YkIYWdzSqxdECe2d4kMEwKl8A'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ key: VAPID_PUBLIC_KEY })
}
