// app/api/stripe/webhook-7etape/route.ts
//
// Plată confirmată în Stripe → cont Supabase + înscriere + magic link pe email.
// Înlocuiește lanțul manual link Stripe → Jotform → acces dat de mână.
//
// ATENȚIE LA CALE: proiectul are deja un webhook Stripe la
// app/api/stripe/webhook/route.ts, care livrează RECONSTRUCȚIA și cartea.
// Fișierul acesta stă DELIBERAT pe altă rută și are propriul endpoint în
// Stripe, cu propriul secret de semnătură. Nu îl mutați peste cel vechi:
// vânzările existente s-ar opri fără ca nimic să pară stricat.
//
// Amândouă endpoint-urile primesc checkout.session.completed pentru ORICE
// plată din cont. De aceea fiecare trebuie să-și recunoască propriile prețuri
// și să iasă tăcut la celelalte — vezi resolvePriceId și verificarea de mai jos.
//
// Data de înscriere setată aici este ceea ce pune în mișcare deschiderea
// progresivă: fiecare modul apare la enrolled_at + drip_offset_days.
// De aceea nu poate veni dintr-un formular completat de om.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Semnătura Stripe se verifică pe corpul brut; runtime Node, nu Edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Clienții se construiesc LENEȘ, la prima cerere — nu la încărcarea modulului.
//
// Next evaluează modulul fiecărei rute în timpul build-ului, la pasul
// „Collecting page data". Un `new Stripe(process.env.X!)` scris la nivel de
// modul se execută atunci; dacă variabila lipsește în mediul acela, aruncă
// „Neither apiKey nor config.authenticator provided" și TOT build-ul cade —
// inclusiv pentru proiectele care n-au nimic de-a face cu plățile.
//
// Webhook-ul vechi al cărții folosește același tipar, din același motiv.
function stripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// Cheia de service ocolește RLS. Nu ajunge niciodată în browser.
function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ATENȚIE: secret de semnătură PROPRIU, nu STRIPE_WEBHOOK_SECRET.
// Variabila aceea e deja folosită de webhook-ul cărții și al RECONSTRUCȚIEI.
// Suprascrisă, ar face vechiul webhook să respingă orice eveniment ca semnătură
// invalidă — plățile ar intra, cartea n-ar mai pleca, și nimic n-ar părea rupt.
function webhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET_7ETAPE!
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'lipsește semnătura' }, { status: 400 })
  }

  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(
      raw,
      signature,
      webhookSecret()
    )
  } catch (err) {
    console.error('[stripe] semnătură invalidă:', err)
    return NextResponse.json({ error: 'semnătură invalidă' }, { status: 400 })
  }

  // Deduplicare. Stripe retrimite același eveniment la orice eșec de rețea,
  // iar fără asta al doilea mesaj rescrie enrolled_at și mută tot calendarul
  // omului cu câteva minute — sau îi trimite un al doilea magic link.
  const { error: dupErr } = await admin()
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (dupErr) {
    if (dupErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[stripe] nu am putut înregistra evenimentul:', dupErr)
    // 500 → Stripe reîncearcă. Preferabil unei plăți fără acces.
    return NextResponse.json({ error: 'eroare de stocare' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionEnded(event.data.object as Stripe.Subscription)
        break
      default:
        // invoice.paid pentru rate: nu face nimic, accesul e deja dat.
        break
    }
  } catch (err) {
    console.error(`[stripe] ${event.type} a eșuat:`, err)
    await admin().from('stripe_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'procesare eșuată' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─────────────────────────────────────────────────────────────────────────────

async function handleCheckout(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email?.trim().toLowerCase()
  if (!email) throw new Error(`sesiunea ${session.id} nu are email`)

  const priceId = await resolvePriceId(session)
  if (!priceId) throw new Error(`sesiunea ${session.id} nu are un preț`)

  const { data: price, error: priceErr } = await admin()
    .from('stripe_prices')
    .select('program_slug, tier, installments')
    .eq('price_id', priceId)
    .single()

  // Prețul nu e al nostru: e o vânzare a celuilalt program (RECONSTRUCȚIA,
  // cartea), care are propriul webhook. Ieșim tăcut.
  //
  // Nu aruncăm eroare aici. O eroare ar întoarce 500, iar Stripe ar reîncerca
  // ore în șir fiecare vânzare de carte — umplând jurnalele cu eșecuri și
  // ascunzând exact eșecurile care contează.
  if (priceErr || !price) {
    console.log(`[7etape] prețul ${priceId} nu e al acestui program — ignorat`)
    return
  }

  const { data: program, error: progErr } = await admin()
    .from('programs')
    .select('id, access_months')
    .eq('slug', price.program_slug)
    .single()

  if (progErr || !program) throw new Error(`programul ${price.program_slug} nu există`)

  const userId = await findOrCreateUser(email)

  const now = new Date()
  const accessUntil = new Date(now)
  accessUntil.setMonth(accessUntil.getMonth() + program.access_months)

  // Ghidarea se adaugă peste o înscriere existentă, nu o înlocuiește
  // și nu resetează calendarul.
  if (price.tier === 'ghidare') {
    const { error } = await admin()
      .from('enrollments')
      .update({
        tier: 'ghidare',
        stripe_subscription_id: session.subscription as string | null,
      })
      .eq('user_id', userId)
      .eq('program_id', program.id)
    if (error) throw error
    return
  }

  const { error: enrollErr } = await admin().from('enrollments').upsert(
    {
      user_id: userId,
      program_id: program.id,
      tier: price.tier,
      enrolled_at: now.toISOString(),
      access_until: accessUntil.toISOString(),
      status: 'active',
      stripe_customer_id: (session.customer as string) ?? null,
      stripe_subscription_id: (session.subscription as string) ?? null,
      stripe_session_id: session.id,
    },
    { onConflict: 'user_id,program_id', ignoreDuplicates: false }
  )
  if (enrollErr) throw enrollErr

  await limiteazaRatele(session, price.installments)

  await sendMagicLink(email)
}

// Plata în rate e, în Stripe, un abonament lunar obișnuit — și un abonament
// lunar nu se oprește singur. Fără linia asta, cine alege „2 × 419 lei" e taxat
// 419 lei în fiecare lună, la nesfârșit, iar noi aflăm de la primul om supărat.
//
// cancel_at spune Stripe exact când să încheie abonamentul: după ultima rată.
// Se pune o dată, la înscriere, și rămâne acolo chiar dacă webhook-ul nu mai
// rulează niciodată — spre deosebire de o numărătoare de facturi, care cere ca
// fiecare eveniment ulterior să ajungă cu bine.
async function limiteazaRatele(
  session: Stripe.Checkout.Session,
  installments: number | null
) {
  if (!installments || installments < 2) return

  const subId = session.subscription as string | null
  if (!subId) {
    console.error(`[stripe] sesiunea ${session.id} are rate dar niciun abonament`)
    return
  }

  const sub = await stripe().subscriptions.retrieve(subId)
  if (sub.cancel_at) return // pus deja; evenimentul se repetă

  // Prima rată se încasează la checkout. Mai rămân installments - 1 facturi,
  // deci abonamentul se încheie la o lună după ultima dintre ele.
  const start = new Date(sub.start_date * 1000)
  const sfarsit = new Date(start)
  sfarsit.setMonth(sfarsit.getMonth() + installments)

  await stripe().subscriptions.update(subId, {
    cancel_at: Math.floor(sfarsit.getTime() / 1000),
    metadata: { ...sub.metadata, rate: String(installments) },
  })
}

async function resolvePriceId(session: Stripe.Checkout.Session): Promise<string | null> {
  if (session.line_items?.data?.[0]?.price?.id) {
    return session.line_items.data[0].price.id
  }
  // line_items nu vine în payload-ul webhook-ului; se cere separat.
  const items = await stripe().checkout.sessions.listLineItems(session.id, { limit: 1 })
  return items.data[0]?.price?.id ?? null
}

async function findOrCreateUser(email: string): Promise<string> {
  const { data: existing, error: lookupErr } = await admin().rpc('get_user_id_by_email', {
    p_email: email,
  })
  if (lookupErr) throw lookupErr
  if (existing) return existing as string

  const { data: created, error: createErr } = await admin().auth.admin.createUser({
    email,
    email_confirm: true, // a plătit; nu-i mai cerem să confirme adresa
  })
  if (createErr) {
    // Cursă între două evenimente simultane: dacă tocmai a apărut, îl luăm.
    const { data: retry } = await admin().rpc('get_user_id_by_email', { p_email: email })
    if (retry) return retry as string
    throw createErr
  }
  return created.user.id
}

// Folosește exact fluxul de magic link deja configurat pentru dashboard,
// cu SMTP-ul din Supabase. Nimic nou de conectat.
async function sendMagicLink(email: string) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/cele-7-etape`,
    },
  })
  // Emailul nu blochează accesul: contul există, omul poate cere singur link nou.
  if (error) console.error('[stripe] magic link neexpediat:', error)
}

async function handleRefund(charge: Stripe.Charge) {
  if (!charge.customer) return
  const { error } = await admin()
    .from('enrollments')
    .update({ status: 'refunded' })
    .eq('stripe_customer_id', charge.customer as string)
  if (error) throw error
}

async function handleSubscriptionEnded(sub: Stripe.Subscription) {
  // Ratele (2× sau 3× 419) se termină normal după ultima plată — asta NU e
  // o anulare. Accesul rămâne. Doar Ghidarea, abonament continuu, se închide.
  const { data: enrollment } = await admin()
    .from('enrollments')
    .select('id, tier')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle()

  if (!enrollment || enrollment.tier !== 'ghidare') return

  const { error } = await admin()
    .from('enrollments')
    .update({ tier: 'harta_instrumente', stripe_subscription_id: null })
    .eq('id', enrollment.id)
  if (error) throw error
}
