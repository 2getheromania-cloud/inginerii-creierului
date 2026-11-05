-- ════════════════════════════════════════════════════════════════════
--  Resetarea Somnului — programul de 21 de zile în platformă
--  5 noiembrie 2026.
--
--  Folosește exact schema „Cele 7 Etape": programs, modules, enrollments,
--  resources, resource_entries, stripe_prices. Nu creează tabele noi.
--
--  ORDINEA, dacă se reconstruiește baza de la zero:
--    1. 20260925_drip_platform.sql
--    2. 20260930_fise_si_trepte.sql
--    3. fișierul acesta
--
--  Deschiderea e ZILNICĂ: modulul N apare în ziua N de la plata fiecărui om.
--  Ziua 1 = ziua plății (decalaj 0).
--
--  La final iese un rând de verificare: 9, 2, 1, 0.
-- ════════════════════════════════════════════════════════════════════


-- ───────────────────────── 1. programul ─────────────────────────

insert into public.programs (slug, name, drip_interval_days, access_months)
values ('resetarea-somnului', 'Resetarea Somnului', 1, 12)
on conflict (slug) do update
  set name               = excluded.name,
      drip_interval_days = excluded.drip_interval_days,
      access_months      = excluded.access_months;


-- ───────────────────────── 2. modulele ─────────────────────────
-- Lecțiile 1–7 câte una pe zi, apoi Sleep Reset (zilele 8–17),
-- apoi consolidarea (zilele 18–21). Textul lecțiilor stă în
-- lib/resetarea-somnului/lectii.ts, nu în bază.

with p as (select id from public.programs where slug = 'resetarea-somnului')
insert into public.modules (program_id, position, slug, title, summary, instrument, drip_offset_days, is_bonus)
select p.id, v.position, v.slug, v.title, v.summary, v.instrument, v.offset_days, false
from p, (values
  (1, 'bazele-somnului',     'Bazele somnului',
   'Ce se întâmplă noaptea, ce tip de somn prost ai și testul de pornire.',
   'Testul de somn', 0),
  (2, 'ceasul-biologic',     'Ceasul biologic',
   'Lumina de dimineață, ora fixă de trezire și cafeina.',
   null, 1),
  (3, 'alimentatie-intestin','Alimentație, intestin și somn',
   'Ora cinei, mese fără vârfuri și ce știm despre microbiom.',
   null, 2),
  (4, 'hormonii-somnului',   'Hormonii somnului',
   'Insulina, foamea, tiroida, menopauza și alcoolul.',
   null, 3),
  (5, 'mediul-de-somn',      'Mediul de somn',
   'Întuneric, răcoare, telefonul afară din dormitor.',
   null, 4),
  (6, 'miscare-stres',       'Mișcare, creier și stres',
   'Mișcarea zilnică și cele zece minute de liniște de seară.',
   null, 5),
  (7, 'unelte-suplimente',   'Unelte și suplimente',
   'Ce merită, ce nu, și când e nevoie de medic.',
   null, 6),
  (8, 'sleep-reset',         'Sleep Reset — 10 zile',
   'Toate obiceiurile, împreună, după un program zilnic. Zilele 8–17.',
   'Jurnalul de 21 de zile', 7),
  (9, 'consolidare',         'Consolidarea',
   'Ce păstrezi, testul final și planul de după. Zilele 18–21.',
   'Testul de somn, a doua oară', 17)
) as v(position, slug, title, summary, instrument, offset_days)
on conflict (program_id, slug) do update
  set position         = excluded.position,
      title            = excluded.title,
      summary          = excluded.summary,
      instrument       = excluded.instrument,
      drip_offset_days = excluded.drip_offset_days;


-- ───────────────────────── 3. cele două instrumente ─────────────────────────
-- Fără modul: se deschid din prima zi, cât ține înscrierea.
-- Se salvează cifrele, nu confesiunile: scoruri, bife, ore de trezire.
-- Întrebările de reflecție din lecții NU se salvează nicăieri.

with p as (select id from public.programs where slug = 'resetarea-somnului')
insert into public.resources
  (program_id, module_id, position, slug, title, kind, path, min_tier, saves_answers, note)
select p.id, null, v.pos, v.slug, v.title, 'fisa', v.path, 'harta', true, v.note
from p, (values
  (1, 'test-somn',      'Testul de somn',
   '/resetarea-somnului/test',
   'Zece întrebări, scor 0–50. Se salvează scorul și răspunsurile la fiecare completare.'),
  (2, 'jurnal-21-zile', 'Jurnalul de 21 de zile',
   '/resetarea-somnului/jurnal',
   'Pe zi: bifele obiceiurilor, cum am dormit (1–5), energia (1–5), ora trezirii.')
) as v(pos, slug, title, path, note)
on conflict (program_id, slug) do update
  set title = excluded.title, path = excluded.path,
      saves_answers = excluded.saves_answers, note = excluded.note;


-- ───────────────────────── 4. prețul Stripe ─────────────────────────
-- Produsul „Detox somn în 21 de zile", 750 lei, plată unică.
-- Linkul de plată: https://buy.stripe.com/cNi9AS1TL9iC9j4g5c5gc0l
-- Webhook-ul webhook-7etape citește tabelul acesta și creează înscrierea;
-- webhook-ul cărții vede că prețul e aici și iese tăcut.

insert into public.stripe_prices (price_id, program_slug, tier, installments, note)
values ('price_1UYQMIBYJzqSoaiHkLKvHzGm', 'resetarea-somnului', 'harta_instrumente', null,
        'Resetarea Somnului — 750 lei, plată unică')
on conflict (price_id) do update
  set program_slug = excluded.program_slug, tier = excluded.tier,
      installments = excluded.installments, note = excluded.note;


-- ───────────────────────── 5. verificarea ─────────────────────────
-- Un singur rând. Trebuie să arate exact: 9, 2, 1, 0.

select
  (select count(*) from public.modules m join public.programs p on p.id = m.program_id
    where p.slug = 'resetarea-somnului')                                  as module,
  (select count(*) from public.resources r join public.programs p on p.id = r.program_id
    where p.slug = 'resetarea-somnului' and r.saves_answers)              as instrumente,
  (select count(*) from public.stripe_prices
    where program_slug = 'resetarea-somnului')                            as preturi,
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ('my_modules','my_resources')
      and coalesce(array_to_string(c.reloptions, ','), '') not ilike '%security_invoker=true%') as vederi_nesigure;
