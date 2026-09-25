# Inginerii Creierului — platformă

Aplicație Next.js pe Vercel, cu Supabase. Domeniu: app.ingineriicreierului.ro

## Ce rulează aici

- **Programul de 6 luni** — dashboard, rapoarte, chat, documente, notificări.
- **Cartea „Noroi pe sandalele sfinților" și RECONSTRUCȚIA** — vânzare prin Stripe,
  livrare pe email cu link de descărcare. Webhook: `app/api/stripe/webhook`.
- **Cele 7 Etape ale Vindecării** — program cu deschidere progresivă, relativă la
  data de înscriere a fiecărui om. Webhook: `app/api/stripe/webhook-7etape`.

## Două webhook-uri Stripe, deliberat

Ambele primesc `checkout.session.completed` pentru orice plată din cont, deci
fiecare trebuie să-și recunoască propriile prețuri și să iasă tăcut la restul.
Fiecare are endpoint separat în Stripe și propriul secret de semnătură
(`STRIPE_WEBHOOK_SECRET` și `STRIPE_WEBHOOK_SECRET_7ETAPE`).

## Baza de date

Migrările în `supabase/migrations/`, numite cu data. Seed-urile în `supabase/seed/`,
se rulează manual în SQL Editor.
