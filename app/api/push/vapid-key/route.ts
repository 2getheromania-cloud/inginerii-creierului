import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ?? process.env.VAPID_PUBLIC_KEY
    ?? 'BLl6oLlrGS4a_uKuda93fWYdLgKB6PvKjNLZd1pTfjLBM2eksPM6631gxAPvVD3vOU_5rIr2uY6oJ7VaJlLjaVQ'
  return NextResponse.json({ key })
}
