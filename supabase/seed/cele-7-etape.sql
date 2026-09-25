-- Seed: programul „Cele 7 Etape ale Vindecării"
-- Decalajele sunt în zile de la înscrierea FIECĂRUI om.
-- Modulul 1 în ziua 0, apoi câte unul la 14 zile. Ultimul bonus în ziua 154 (22 de săptămâni).

insert into public.programs (slug, name, drip_interval_days, access_months)
values ('cele-7-etape', 'Cele 7 Etape ale Vindecării', 14, 12)
on conflict (slug) do update
  set name = excluded.name,
      drip_interval_days = excluded.drip_interval_days,
      access_months = excluded.access_months;

with p as (select id from public.programs where slug = 'cele-7-etape')
insert into public.modules (program_id, position, slug, title, summary, instrument, drip_offset_days, is_bonus)
select p.id, v.position, v.slug, v.title, v.summary, v.instrument, v.offset_days, v.is_bonus
from p, (values
  (1,  'harta',            'Harta: de ce ești încă bolnav',
       'De ce protocoalele izolate eșuează. Principiul ierarhiei.',
       'Autoevaluarea pe 7 etape',                                 0,   false),
  (2,  'celula-aparare',   'Celula în modul de apărare',
       'Mitocondriile și răspunsul celular la pericol. Mecanism demonstrat vs ipoteză.',
       'Jurnalul de energie pe 7 zile',                            14,  false),
  (3,  'etapa-1-mediul',   'Etapa 1 — Mediul',
       'Mucegai, metale grele, ultraprocesate, alcool, pesticide.',
       'Checklist de mediu + plan de eliminare în 21 de zile',     28,  false),
  (4,  'etapa-2-corpul-fizic', 'Etapa 2 — Corpul fizic',
       'Microbiom, permeabilitate intestinală, tiroidă, insulină, inflamație.',
       'PFI simplificat + lista de analize pentru medic',          42,  false),
  (5,  'etapa-3-ritmuri',  'Etapa 3 — Ritmuri și sistem nervos',
       'Somn, lumină, cafeină, HRV, respirație, mișcare.',
       'Fișa de ritm pe 14 zile',                                  56,  false),
  (6,  'etapa-4-emotional','Etapa 4 — Corpul emoțional',
       'Stres cronic și axa HPA, ACE, reglare somatică.',
       'Chestionarul ACE + 3 exerciții de reglare',                70,  false),
  (7,  'etapa-5-mental',   'Etapa 5 — Corpul mental',
       'Convingeri de bază, perfecționism, ruminație.',
       'Cartografierea convingerilor',                             84,  false),
  (8,  'etapa-6-relational','Etapa 6 — Corpul relațional',
       'Atașament, tipare transgeneraționale, coreglare, granițe.',
       'Genogramă pe 3 generații + plan de coreglare',             98,  false),
  (9,  'etapa-7-sensul',   'Etapa 7 — Sensul',
       'Valori, scop, credință, comunitate.',
       'Exercițiul de valori + ritualul săptămânal de sens',       112, false),
  (10, 'cazul-complet',    'Cazul complet',
       'Un participant parcurs prin toate cele 7 etape.',
       'Planul personal de lucru pe 6 luni',                       126, false),
  (11, 'bonus-tiroida',    'Bonus — Tiroida și microbiomul',
       'Hashimoto, conversia T4→T3, seleniu, gluten, SIBO.',
       null,                                                       140, true),
  (12, 'bonus-insulina',   'Bonus — Insulina și energia',
       'Rezistența la insulină la normoponderali, post intermitent, ordinea meselor.',
       null,                                                       154, true)
) as v(position, slug, title, summary, instrument, offset_days, is_bonus)
on conflict (program_id, slug) do update
  set title            = excluded.title,
      summary          = excluded.summary,
      instrument       = excluded.instrument,
      drip_offset_days = excluded.drip_offset_days,
      position         = excluded.position,
      is_bonus         = excluded.is_bonus;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lecțiile modulelor 1–5.
--
-- ATENȚIE, două lucruri diferite aici:
--   • DURATELE sunt reale, măsurate pe clipurile montate (modulul 5: estimări
--     la 138 cuv/min, se înlocuiesc după filmare).
--   • TITLURILE lecțiilor din modulele 1–4 sunt provizorii — le-am derivat din
--     descrierea modulelor, nu din scripturi. Se înlocuiesc din documentul
--     „Scripturi video — Modulele 1–5" înainte de lansare.
--     Titlurile modulului 5 sunt cele reale, din scripturi.
--
-- video_id se completează după încărcarea pe Vimeo.
-- Modulele 6–12 se adaugă pe măsură ce se filmează.

with m as (
  select mo.id, mo.slug
  from public.modules mo
  join public.programs p on p.id = mo.program_id
  where p.slug = 'cele-7-etape'
)
insert into public.lessons (module_id, position, title, duration_seconds)
select m.id, v.position, v.title, v.secs
from (values
  ('harta', 1, 'De ce ești încă bolnav',                     200),
  ('harta', 2, 'Cele trei greșeli de ordine',                368),
  ('harta', 3, 'Cascada de șapte bazine',                    374),
  ('harta', 4, 'Cum se citește harta',                       285),
  ('harta', 5, 'Ce înseamnă un caz complex',                 324),
  ('harta', 6, 'Autoevaluarea pe 7 etape',                   258),

  ('celula-aparare', 1, 'Celula care nu primește semnalul de retragere', 381),
  ('celula-aparare', 2, 'Ce e mecanism și ce e ipoteză',      227),
  ('celula-aparare', 3, 'Mitocondriile, pe scara dovezii',    342),
  ('celula-aparare', 4, 'Jurnalul de energie',                335),

  ('etapa-1-mediul', 1, 'Ce intră în tine',                   456),
  ('etapa-1-mediul', 2, 'Mucegaiul: ce se testează',          363),
  ('etapa-1-mediul', 3, 'Metalele grele',                     369),
  ('etapa-1-mediul', 4, 'Ultraprocesatele și alcoolul',       442),
  ('etapa-1-mediul', 5, 'Ce protocoale de detox nu rezistă',  362),
  ('etapa-1-mediul', 6, 'Planul de eliminare în 21 de zile',  371),

  ('etapa-2-corpul-fizic', 1, 'Microbiomul, pe scurt',        423),
  ('etapa-2-corpul-fizic', 2, 'Permeabilitatea intestinală',  419),
  ('etapa-2-corpul-fizic', 3, 'Tiroida dincolo de TSH',       397),
  ('etapa-2-corpul-fizic', 4, 'Glutenul: ce rezistă',         391),
  ('etapa-2-corpul-fizic', 5, 'Addendum — corecția pe gluten',116),
  ('etapa-2-corpul-fizic', 6, 'Insulina și ordinea meselor',  451),
  ('etapa-2-corpul-fizic', 7, 'Inflamația',                   289),
  ('etapa-2-corpul-fizic', 8, 'Lista de analize pentru medic',297),

  ('etapa-3-ritmuri', 1, 'Corpul nu întreabă „cât", întreabă „când"', 390),
  ('etapa-3-ritmuri', 2, 'Lumina: singurul buton care mută ceasul',   326),
  ('etapa-3-ritmuri', 3, 'Ce repară somnul, și povestea care circulă',322),
  ('etapa-3-ritmuri', 4, 'Cofeina și alcoolul',                       350),
  ('etapa-3-ritmuri', 5, 'Ce funcționează pentru insomnie',           373),
  ('etapa-3-ritmuri', 6, 'Ce măsoară HRV și ce nu',                   367),
  ('etapa-3-ritmuri', 7, 'Protocolul de 14 zile',                     383)
) as v(module_slug, position, title, secs)
join m on m.slug = v.module_slug
on conflict (module_id, position) do update
  set title            = excluded.title,
      duration_seconds = excluded.duration_seconds;

-- ─────────────────────────────────────────────────────────────────────────────
-- Prețurile Stripe. Id-uri REALE, create și verificate pe 25 sept 2026 în contul
-- Leadership2gether SRL (live). Produse: prod_VK6Y5d8hdQva3q (Harta),
-- prod_VK6bieAOpFIfcR (Harta + Instrumente), prod_VK6cV3KczUOxQz (Ghidare).
-- Tabelul se poate edita fără redeploy: preț nou = rând nou, nu cod schimbat.

insert into public.stripe_prices (price_id, program_slug, tier, installments, note) values
  ('price_1UJSLZBYJzqSoaiHVoHdgaZL', 'cele-7-etape', 'harta',             null, 'Harta — plată unică 797 lei'),
  ('price_1UJSLZBYJzqSoaiHSWqxqZZc', 'cele-7-etape', 'harta',                2, 'Harta — 2 rate a 419 lei'),
  ('price_1UJSO0BYJzqSoaiHnjg3uPrc', 'cele-7-etape', 'harta_instrumente', null, 'Harta + Instrumente — plată unică 1.197 lei'),
  ('price_1UJSO0BYJzqSoaiHlpYEh7GV', 'cele-7-etape', 'harta_instrumente',    3, 'Harta + Instrumente — 3 rate a 419 lei'),
  ('price_1UJSPKBYJzqSoaiHBq9uQcoG', 'cele-7-etape', 'ghidare',           null, 'Ghidare — abonament lunar, minimum 3 luni')
on conflict (price_id) do update
  set program_slug = excluded.program_slug,
      tier         = excluded.tier,
      installments = excluded.installments,
      note         = excluded.note;
