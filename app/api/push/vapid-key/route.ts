import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  return NextResponse.json({ key })
}
