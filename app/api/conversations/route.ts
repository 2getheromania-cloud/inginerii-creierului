import { getOrCreateConversation } from '@/lib/conversations'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const conversationId = await getOrCreateConversation(user.id)
  return NextResponse.json({ id: conversationId })
}
