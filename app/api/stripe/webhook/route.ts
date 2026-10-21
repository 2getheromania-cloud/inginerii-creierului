import { createClient as supa } from '@supabase/supabase-js'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { isCorpulNuCitesteFacebook } from '@/lib/books'

export const runtime = 'nodejs'

const BOOK_SLUG = 'noroi-pe-sandalele-sfintilor'
const FROM = 'Inginerii Creierului <carte@ingineriicreierului.ro>'
const FROM_RECONSTRUCTIA = 'Psiholog Narcisa Ispas <carte@ingineriicreierului.ro>'
const APP_URL = 'https://app.ingineriicreierului.ro'
const CNCF_SLUG = 'corpul-nu-citeste-facebook'
const FROM_CNCF = 'Alin Ispas · Inginerii Creierului <carte@ingineriicreierului.ro>'
const FROM_REDESCHIDE = 'Narcisa Ispas <carte@ingineriicreierului.ro>'
const REDESCHIDE_PRODUCT_ID = 'prod_VNw3dfYQnsrVDu'
const REDESCHIDE_ACCES_URL = 'https://reconstruieste-te.ro/acces-redeschide-dosarul/'


// Prețurile programului „Cele 7 Etape ale Vindecării".
// Tratate de app/api/stripe/webhook-7etape/route.ts, care are endpoint propriu.
// Aici doar se ignoră: ambele endpoint-uri primesc checkout.session.completed
// pentru orice plată din cont.
const SAPTE_ETAPE_PRICE_IDS = [
  'price_1UJSLZBYJzqSoaiHVoHdgaZL', // Harta — 797 lei
  'price_1UJSLZBYJzqSoaiHSWqxqZZc', // Harta — 2 rate
  'price_1UJSO0BYJzqSoaiHnjg3uPrc', // Harta + Instrumente — 1.197 lei
  'price_1UJSO0BYJzqSoaiHlpYEh7GV', // Harta + Instrumente — 3 rate
  'price_1UJSPKBYJzqSoaiHBq9uQcoG', // Ghidare — 397 lei/lună
]

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
  const prenume = name.trim().split(/\s+/)[0] || 'dragă prietenă'
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
  const prenume = name.trim().split(/\s+/)[0] || 'dragă prietenă'
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

// „Redeschide Dosarul" — microprogramul de pe reconstruieste-te.ro.
// Nu are carte de descarcat: accesul e o pagina pe site, nu un fisier.
function isRedeschideDosarul(productName: string) {
  const normalized = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
  return normalized.includes('REDESCHIDE DOSARUL')
}

function redeschideEmailHtml(name: string) {
  const prenume = name.trim().split(/\s+/)[0] || ''
  const salut = prenume ? `Bună, ${prenume},` : 'Bună,'
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#1f2937;line-height:1.6">
<p>${salut}</p>
<p>Mulțumesc că ai ales să deschizi dosarul. Nu e un gest mic.</p>
<p>Ai acces complet la cele patru înregistrări și la workbook aici:</p>
<p><a href="${REDESCHIDE_ACCES_URL}" style="display:inline-block;background:#14342B;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">Deschide materialele</a></p>
<p style="color:#6b7280;font-size:13px">Dacă butonul nu funcționează, copiază linkul: ${REDESCHIDE_ACCES_URL}</p>
<p><strong>Salvează linkul la favorite.</strong> E calea ta de întoarcere la materiale, iar accesul nu expiră.</p>
<p>Trei lucruri, înainte să începi:</p>
<p>Ia lecțiile pe rând, nu toate într-o zi. Fiecare are nevoie de timp ca să se așeze.</p>
<p>Tipărește workbookul înainte de prima lecție. Nu e un material de citit, e un caiet de lucru — scrii în el, de mână, pe măsură ce mergi prin lecții.</p>
<p>Dacă o întrebare te blochează, lasă-o și revino la ea. Blocajul e informație, nu eșec.</p>
<p>Ne vedem în lecția 1.</p>
<p style="margin-top:24px">Narcisa Ispas<br/>Psiholog clinician · reconstruieste-te.ro</p>
</div>`
}

function redeschideEmailText(name: string) {
  const prenume = name.trim().split(/\s+/)[0] || ''
  const salut = prenume ? `Bună, ${prenume},` : 'Bună,'
  return `${salut}

Mulțumesc că ai ales să deschizi dosarul. Nu e un gest mic.

Ai acces complet la cele patru înregistrări și la workbook aici:
${REDESCHIDE_ACCES_URL}

Salvează linkul la favorite. E calea ta de întoarcere la materiale, iar accesul nu expiră.

Trei lucruri, înainte să începi:

Ia lecțiile pe rând, nu toate într-o zi. Fiecare are nevoie de timp ca să se așeze.

Tipărește workbookul înainte de prima lecție. Nu e un material de citit, e un caiet de lucru — scrii în el, de mână, pe măsură ce mergi prin lecții.

Dacă o întrebare te blochează, lasă-o și revino la ea. Blocajul e informație, nu eșec.

Ne vedem în lecția 1.

Narcisa Ispas
Psiholog clinician · reconstruieste-te.ro`
}


// „Corpul nu citește Facebook” — carte digitală, două formate pe același link.
function cncfEmailHtml(name: string, token: string) {
  const prenume = name.trim().split(/\s+/)[0] || ''
  const salut = prenume ? `Bună, ${prenume},` : 'Bună,'
  const pdf = `${APP_URL}/download/${token}?f=pdf`
  const epub = `${APP_URL}/download/${token}?f=epub`
  const btn = 'display:inline-block;background:#133D13;color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:6px 8px 6px 0'
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#1C1713;line-height:1.6">
<p>${salut}</p>
<p>Mulțumesc că ai ales <strong>„Corpul nu citește Facebook”</strong>. De acum, data viitoare când primești pe WhatsApp „un sfat de sănătate”, ai la îndemână un filtru prin care să-l treci.</p>
<p>Cartea e a ta, în două formate. Alege-l pe cel potrivit:</p>
<p>
<a href="${pdf}" style="${btn}">Descarcă PDF</a>
<a href="${epub}" style="${btn};background:#B08A3C">Descarcă EPUB</a>
</p>
<p><strong>PDF</strong> — pentru telefon, tabletă sau calculator. Se deschide oriunde și arată exact ca o carte.<br/>
<strong>EPUB</strong> — pentru cititoare electronice și aplicații de citit (Kindle, Apple Books, Google Play Books). Textul se așază după ecran și poți mări litera.</p>
<p style="color:#5E534A;font-size:13px">Linkurile sunt personale și pot fi folosite de până la 10 ori în total. Te rog să nu le distribui. Factura vine separat, pe același email.</p>
<p>Un singur sfat de început: nu citi cartea de la cap la coadă dintr-o suflare. Alege capitolul care te privește acum. Fiecare se termină cu „ce faci concret”.</p>
<p>Dacă ai orice problemă cu descărcarea, răspunde direct la acest email.</p>
<p style="margin-top:24px">Cu drag,<br/><strong>Alin Ispas</strong><br/>Inginerii Creierului</p>
</div>`
}

function cncfEmailText(name: string, token: string) {
  const prenume = name.trim().split(/\s+/)[0] || ''
  const salut = prenume ? `Bună, ${prenume},` : 'Bună,'
  return `${salut}

Mulțumesc că ai ales „Corpul nu citește Facebook”.

Cartea e a ta, în două formate:

PDF (telefon, tabletă, calculator):
${APP_URL}/download/${token}?f=pdf

EPUB (Kindle, Apple Books, Google Play Books):
${APP_URL}/download/${token}?f=epub

Linkurile sunt personale și pot fi folosite de până la 10 ori în total. Factura vine separat, pe același email.

Dacă ai orice problemă cu descărcarea, răspunde direct la acest email.

Cu drag,
Alin Ispas
Inginerii Creierului`
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
            let isSapteEtapePurchase = false
        let isCorpulPurchase = false
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
            isSapteEtapePurchase = lineItems.data.some((item) =>
        SAPTE_ETAPE_PRICE_IDS.includes(item.price?.id ?? '')
      )
          isCorpulPurchase = lineItems.data.some((item) => {
            const product = item.price?.product
            const productName =
              product && typeof product === 'object' && 'name' in product
                ? (product.name ?? '')
                : ''
            return isCorpulNuCitesteFacebook(productName || item.description || '')
          })
        } catch (liErr) {
          console.error('[stripe webhook] listLineItems error:', (liErr as Error).message)
        }
    // Vânzare a programului „Cele 7 Etape": are webhook propriu (webhook-7etape).
    // Ieșim înainte de upsert și înainte de emailul cu cartea.
    if (isSapteEtapePurchase) {
      return NextResponse.json({ received: true, ignored: 'cele-7-etape' })
    }
    // „Redeschide Dosarul" — microprogramul de pe reconstruieste-te.ro.
    // Are pagina proprie de acces, nu o carte: trimitem emailul cu linkul si iesim
    // inainte de upsert, ca sa nu plece emailul cartii si sa nu se creeze token de download.
    let isRedeschidePurchase = false
    try {
      const rdItems = await stripe().checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      })
      isRedeschidePurchase = rdItems.data.some((item) => {
        const product = item.price?.product
        const productId =
          typeof product === 'string'
            ? product
            : product && typeof product === 'object' && 'id' in product
              ? product.id
              : ''
        const productName =
          product && typeof product === 'object' && 'name' in product
            ? (product.name ?? '')
            : ''
        return (
          productId === REDESCHIDE_PRODUCT_ID ||
          isRedeschideDosarul(productName || item.description || '')
        )
      })
    } catch (rdErr) {
      console.error('[stripe webhook] listLineItems (redeschide) error:', (rdErr as Error).message)
    }
    if (isRedeschidePurchase) {
      const resendRd = new Resend(process.env.RESEND_API_KEY)
      const { error: rdMailError } = await resendRd.emails.send({
        from: FROM_REDESCHIDE,
        to: email,
        subject: 'Ai acces la REDESCHIDE DOSARUL',
        html: redeschideEmailHtml(name),
        text: redeschideEmailText(name),
      })
      if (rdMailError) {
        console.error('[stripe webhook] resend (redeschide) error:', rdMailError)
        return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
      }
      return NextResponse.json({ received: true, handled: 'redeschide-dosarul' })
    }
        // Upsert idempotent — dacă session-ul există deja, nu se inserează nimic nou.
        // Identic pentru ambele produse, ca linkul /download/[token] să funcționeze la fel.
        const { data, error } = await service()
          .from('purchases')
          .upsert(
            {
              email,
              stripe_session_id: session.id,
              book_slug: isCorpulPurchase ? CNCF_SLUG : BOOK_SLUG,
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

          const emailPayload = isCorpulPurchase
            ? {
                from: FROM_CNCF,
                to: email,
                subject: 'Cartea ta: „Corpul nu citește Facebook”',
                html: cncfEmailHtml(name, inserted.download_token),
                text: cncfEmailText(name, inserted.download_token),
              }
            : isReconstructiaPurchase
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
