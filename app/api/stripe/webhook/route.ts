import { createClient as supa } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOOK_SLUG = 'noroi-pe-sandalele-sfintilor'
const FROM = 'Inginerii Creierului <carte@ingineriicreierului.ro>'
const APP_URL = 'https://app.ingineriicreierului.ro'

// Client admin (service role) — fără cookie-uri, bypass complet RLS
function service() {
  return supa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function stripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function downloadEmailHtml(name: string, token: string) {
  const link = `${APP_URL}/download/${token}`
  return `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1f2937">
      <h2 style="color:#166534">Mulțumesc din suflet, ${name || 'dragă cititorule'}!</h2>
      <p>Mă bucur tare mult că ai ales să citești <strong>„Noroi pe sandalele sfinților"</strong>.
      Sper ca aceste pagini să-ți aducă mângâiere, lumină și un strop de liniște în suflet.</p>
      <p>Poți descărca cartea apăsând butonul de mai jos:</p>
      <a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Descarcă cartea
      </a>
      <p style="color:#6b7280;font-size:13px">Link-ul de descărcare este personal și poate fi folosit de câteva ori. Te rog să nu îl distribui.</p>
      <p style="margin-top:24px">Cu drag și recunoștință,<br/><strong>Psiholog Narcisa Ispas</strong></p>
    </div>`
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Body-ul brut e necesar pentru verificarea semnăturii
    const rawBody = await req.text()

    let event: Stripe.Event
    try {
      event = stripe().webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('[stripe webhook] signature verification failed:', (err as Error).message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const email = session.customer_details?.email
        const name = session.customer_details?.name ?? ''

        if (!email) {
          console.error('[stripe webhook] paid session fără email:', session.id)
          return NextResponse.json({ received: true })
        }

        // Upsert idempotent — dacă session-ul există deja, nu se inserează nimic nou
        const { data, error } = await service()
          .from('purchases')
          .upsert(
            {
              email,
              stripe_session_id: session.id,
              book_slug: BOOK_SLUG,
            },
            { onConflict: 'stripe_session_id', ignoreDuplicates: true }
          )
          .select('download_token')

        if (error) {
          console.error('[stripe webhook] upsert error:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Rând nou inserat → data conține download_token. Duplicat → data e gol, nu retrimitem.
        const inserted = data && data.length > 0 ? data[0] : null
        if (inserted?.download_token) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const { error: mailError } = await resend.emails.send({
            from: FROM,
            to: email,
            subject: 'Cartea ta: „Noroi pe sandalele sfinților"',
            html: downloadEmailHtml(name, inserted.download_token),
          })
          if (mailError) {
            console.error('[stripe webhook] resend error:', mailError)
            return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook] unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
