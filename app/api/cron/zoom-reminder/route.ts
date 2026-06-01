import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'
import { Resend } from 'resend'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = service()

  const { data: admin } = await db
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'admin')
    .maybeSingle()

  if (!admin) return NextResponse.json({ ok: true, msg: 'no admin found' })

  const title = 'Întâlnire Zoom azi la 19:30'
  const body = 'Azi la 19:30 ai întâlnirea săptămânală de mentorare IC.'

  try {
    await sendPushToUser(admin.id, { title, body, url: '/' })
  } catch {}

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Inginerii Creierului <noreply@ingineriicreierului.ro>',
      to: admin.email,
      subject: title,
      html: `<p style="font-family:sans-serif;font-size:16px">${body}</p>`,
    })
  } catch {}

  return NextResponse.json({ ok: true })
}
