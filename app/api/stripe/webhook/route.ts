import { createClient as supa } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOOK_SLUG = 'noroi-pe-sandalele-sfintilor'
const FROM = 'Inginerii Creierului <carte@ingineriicreierului.ro>'
const FROM_RECONSTRUCTIA = 'Psiholog Narcisa Ispas <carte@ingineriicreierului.ro>'
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

function reconstructiaEmailHtml(name: string, token: string) {
  const prenume = name || 'dragă prietenă'
  const downloadUrl = `${APP_URL}/download/${token}`
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#1f2937;line-height:1.6">
      <p>Dragă ${prenume},</p>
      <p>Bine ai venit în <strong>RECONSTRUCȚIA</strong>. Locul tău e rezervat — ești una dintre cele 14 femei ale ediției fondatoare, și vreau să știi de la început: nu ai cumpărat opt întâlniri. Ai cumpărat un instrument pe care îl vei folosi toată viața.</p>
      <p><strong>Ce trebuie să știi, pe scurt:</strong></p>
      <p>📅 Începem <strong>marți, 15 septembrie, la ora 19:00</strong> (ora României). Ne întâlnim în fiecare marți, 19:00–20:30, timp de 8 săptămâni, pe Zoom.</p>
      <p>🔗 <strong>Linkul întâlnirilor</strong> (același în fiecare marți — salvează-l):<br/>
        <a href="https://us06web.zoom.us/j/81806140406?pwd=LZBJXr4p16NQbbMQWuujKkIaVbYJUZ.1" style="color:#166534">https://us06web.zoom.us/j/81806140406?pwd=LZBJXr4p16NQbbMQWuujKkIaVbYJUZ.1</a></p>
      <p>💬 <strong>Grupul privat de WhatsApp</strong> — aici primești fișele, aici ne încurajăm între întâlniri. Intră chiar azi și scrie un „Bună":<br/>
        <a href="https://chat.whatsapp.com/FlCkoU3RaDX6AW88ApP5Gq" style="color:#166534">https://chat.whatsapp.com/FlCkoU3RaDX6AW88ApP5Gq</a></p>
      <p>📖 <strong>Cartea „Noroi pe sandalele sfinților"</strong> (ediția digitală) e a ta din prima zi — o descarci de aici:<br/>
        <a href="${downloadUrl}" style="color:#166534">${downloadUrl}</a></p>
      <p><strong>Cum arată o săptămână împreună:</strong> marți seara ne vedem live — o lecție scurtă, apoi lucrăm ghidat pe fișa săptămânii și discutăm. Între întâlniri ai o practică de 10 minute pe zi. Atât. Nu-ți cer ore — îți cer consecvență.</p>
      <p><strong>Ce să pregătești până pe 15 septembrie:</strong> un caiet nou, un pix și un loc liniștit pentru serile de marți — cu camera pornită, pentru că aici nu asculți un curs, faci parte dintr-un grup.</p>
      <p>Două lucruri pe care ți le promit — și pe care le cer și de la tine: tot ce se spune în grup rămâne în grup, fără excepții; și nimeni nu e obligată să vorbească înainte să fie pregătită. Întâlnirile se înregistrează doar pentru participantele acestei ediții — dacă lipsești, prinzi înregistrarea, disponibilă 6 luni.</p>
      <p>Dacă ai orice întrebare până la start, răspunde direct la acest email.</p>
      <p>Ne vedem pe 15 septembrie. Vino așa cum ești.</p>
      <p style="margin-top:24px">Cu drag,<br/><strong>Narcisa Ispas</strong><br/>Psiholog clinician · reconstruieste-te.ro</p>
    </div>`
}

function reconstructiaEmailText(name: string, token: string) {
  const prenume = name || 'dragă prietenă'
  const downloadUrl = `${APP_URL}/download/${token}`
  return `Dragă ${prenume},

Bine ai venit în RECONSTRUCȚIA. Locul tău e rezervat — ești una dintre cele 14 femei ale ediției fondatoare, și vreau să știi de la început: nu ai cumpărat opt întâlniri. Ai cumpărat un instrument pe care îl vei folosi toată viața.

Ce trebuie să știi, pe scurt:

📅 Începem marți, 15 septembrie, la ora 19:00 (ora României). Ne întâlnim în fiecare marți, 19:00–20:30, timp de 8 săptămâni, pe Zoom.

🔗 Linkul întâlnirilor (același în fiecare marți — salvează-l):
https://us06web.zoom.us/j/81806140406?pwd=LZBJXr4p16NQbbMQWuujKkIaVbYJUZ.1

💬 Grupul privat de WhatsApp — aici primești fișele, aici ne încurajăm între întâlniri. Intră chiar azi și scrie un „Bună":
https://chat.whatsapp.com/FlCkoU3RaDX6AW88ApP5Gq

📖 Cartea „Noroi pe sandalele sfinților" (ediția digitală) e a ta din prima zi — o descarci de aici:
${downloadUrl}

Cum arată o săptămână împreună: marți seara ne vedem live — o lecție scurtă, apoi lucrăm ghidat pe fișa săptămânii și discutăm. Între întâlniri ai o practică de 10 minute pe zi. Atât. Nu-ți cer ore — îți cer consecvență.

Ce să pregătești până pe 15 septembrie: un caiet nou, un pix și un loc liniștit pentru serile de marți — cu camera pornită, pentru că aici nu asculți un curs, faci parte dintr-un grup.

Două lucruri pe care ți le promit — și pe care le cer și de la tine: tot ce se spune în grup rămâne în grup, fără excepții; și nimeni nu e obligată să vorbească înainte să fie pregătită. Întâlnirile se înregistrează doar pentru participantele acestei ediții — dacă lipsești, prinzi înregistrarea, disponibilă 6 luni.

Dacă ai orice întrebare până la start, răspunde direct la acest email.

Ne vedem pe 15 septembrie. Vino așa cum ești.

Cu drag,
Narcisa Ispas
Psiholog clinician · reconstruieste-te.ro`
}

// Normalizează pentru comparație: elimină diacriticele și trece la uppercase.
// Tratează atât „RECONSTRUCȚIA" cât și „RECONSTRUCTIA".
function isReconstructia(productName: string) {
  const normalized = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
  return normalized.includes('RECONSTRUCTIA')
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

        // Determină produsul cumpărat din line items (numele produsului).
        // Ramificarea de email se face pe baza acestui nume; livrarea cărții rămâne identică.
        let isReconstructiaPurchase = false
        try {
          const lineItems = await stripe().checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
          })
          isReconstructiaPurchase = lineItems.data.some((item) => {
            const product = item.price?.product
            const productName =
              product && typeof product === 'object' && 'name' in product
                ? (product.name ?? '')
                : ''
            const itemName = productName || item.description || ''
            return isReconstructia(itemName)
          })
        } catch (liErr) {
          console.error('[stripe webhook] listLineItems error:', (liErr as Error).message)
        }

        // Upsert idempotent — dacă session-ul există deja, nu se inserează nimic nou.
        // Identic pentru ambele produse, ca linkul /download/[token] să funcționeze la fel.
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

          const emailPayload = isReconstructiaPurchase
            ? {
                from: FROM_RECONSTRUCTIA,
                to: email,
                subject: 'Locul tău în RECONSTRUCȚIA e rezervat ✔ Toate detaliile aici',
                html: reconstructiaEmailHtml(name, inserted.download_token),
                text: reconstructiaEmailText(name, inserted.download_token),
              }
            : {
                from: FROM,
                to: email,
                subject: 'Cartea ta: „Noroi pe sandalele sfinților"',
                html: downloadEmailHtml(name, inserted.download_token),
              }

          const { error: mailError } = await resend.emails.send(emailPayload)
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
