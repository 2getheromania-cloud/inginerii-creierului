import { createClient as supa } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const { data: profile } = await service().from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

// PATCH — update name, drive_url, or is_active
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    name?: string
    drive_url?: string | null
    is_active?: boolean
  }

  const update: Record<string, unknown> = {}
  if (body.name !== undefined)      update.name      = body.name.trim()
  if ('drive_url' in body)          update.drive_url = body.drive_url?.trim() || null
  if (body.is_active !== undefined) update.is_active = body.is_active

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Niciun câmp de actualizat.' }, { status: 400 })
  }

  const { data, error } = await service()
    .from('protocol_types')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
