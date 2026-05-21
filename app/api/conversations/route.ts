import { getOrCreateConversation } from '@/lib/conversations'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { otherUserId } = await req.json() as { otherUserId: string }
  if (!otherUserId) return NextResponse.json({ error: 'otherUserId required' }, { status: 400 })

  const id = await getOrCreateConversation(user.id, otherUserId)
  return NextResponse.json({ id })
}
