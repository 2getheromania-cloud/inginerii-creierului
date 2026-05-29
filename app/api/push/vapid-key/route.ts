import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ?? process.env.VAPID_PUBLIC_KEY
    ?? 'BAWhOjm9knU0dWmj-lxm_JZyguNRDDT8mTcziNI2Nk_Rj6KgX4iSbxx6iyTuyz-UaPgU7xoq-h6ZS5SDu4U7D_M'
  return NextResponse.json({ key })
}
