-- Seed: programul „Cele 7 Etape ale Vindecării"
-- Stare la 30 septembrie 2026. ACEST FIȘIER ÎNLOCUIEȘTE COMPLET versiunea veche.
--
-- Trei lucruri s-au schimbat față de prima variantă, toate deja aplicate în bază:
--   1. RITM SĂPTĂMÂNAL. Un modul la 7 zile de la înscrierea fiecărui om.
--      Ultimul bonus în ziua 77 (11 săptămâni). Înainte era 14 zile / 22 de săptămâni.
--   2. TITLURILE REALE ale lecțiilor, luate de pe Vimeo. Cele vechi erau provizorii,
--      derivate din descrierea modulelor. La modulul 4 diferă și conținutul, nu doar
--      formularea.
--   3. ID-URILE VIMEO și DURATELE REALE. Program complet: 3 ore și 25 de minute.
--
-- Dacă rulați varianta veche a acestui fișier peste bază, toate cele trei se pierd
-- în tăcere: `on conflict do update` rescrie exact coloanele astea.

insert into public.programs (slug, name, drip_interval_days, access_months)
values ('cele-7-etape', 'Cele 7 Etape ale Vindecării', 7, 12)
on conflict (slug) do update
  set name = excluded.name,
      drip_interval_days = excluded.drip_interval_days,
      access_months = excluded.access_months;


-- ───────────────────────────── modulele ─────────────────────────────
-- Decalajul e (poziția − 1) × 7 zile, de la înscrierea FIECĂRUI om.

with p as (select id from public.programs where slug = 'cele-7-etape')
insert into public.modules (program_id, position, slug, title, summary, instrument, drip_offset_days, is_bonus)
select p.id, v.position, v.slug, v.title, v.summary, v.instrument, v.offset_days, v.is_bonus
from p, (values
  (1 , 'harta',               'Harta: de ce ești încă bolnav',      
   'De ce protocoalele izolate eșuează. Principiul ierarhiei.',
   'Autoevaluarea pe 7 etape',                                0, false),
  (2 , 'celula-aparare',      'Celula în modul de apărare',         
   'Mitocondriile și răspunsul celular la pericol. Mecanism demonstrat vs ipoteză.',
   'Jurnalul de energie pe 7 zile',                           7, false),
  (3 , 'etapa-1-mediul',      'Etapa 1 — Mediul',                   
   'Mucegai, metale grele, ultraprocesate, alcool, pesticide.',
   'Checklist de mediu + plan de eliminare în 21 de zile',   14, false),
  (4 , 'etapa-2-corpul-fizic', 'Etapa 2 — Corpul fizic',             
   'Microbiom, permeabilitate intestinală, tiroidă, insulină, inflamație.',
   'PFI simplificat + lista de analize pentru medic',        21, false),
  (5 , 'etapa-3-ritmuri',     'Etapa 3 — Ritmuri și sistem nervos', 
   'Somn, lumină, cafeină, HRV, respirație, mișcare.',
   'Fișa de ritm pe 14 zile',                                28, false),
  (6 , 'etapa-4-emotional',   'Etapa 4 — Corpul emoțional',         
   'Stres cronic și axa HPA, ACE, reglare somatică.',
   'Chestionarul ACE + 3 exerciții de reglare',              35, false),
  (7 , 'etapa-5-mental',      'Etapa 5 — Corpul mental',            
   'Convingeri de bază, perfecționism, ruminație.',
   'Cartografierea convingerilor',                           42, false),
  (8 , 'etapa-6-relational',  'Etapa 6 — Corpul relațional',        
   'Atașament, tipare transgeneraționale, coreglare, granițe.',
   'Genogramă pe 3 generații + plan de coreglare',           49, false),
  (9 , 'etapa-7-sensul',      'Etapa 7 — Sensul',                   
   'Valori, scop, credință, comunitate.',
   'Exercițiul de valori + ritualul săptămânal de sens',     56, false),
  (10, 'cazul-complet',       'Cazul complet',                      
   'Un participant parcurs prin toate cele 7 etape.',
   'Planul personal de lucru pe 6 luni',                     63, false),
  (11, 'bonus-tiroida',       'Bonus — Tiroida și microbiomul',     
   'Hashimoto, conversia T4→T3, seleniu, gluten, SIBO.',
   null,                                                     70, true),
  (12, 'bonus-insulina',      'Bonus — Insulina și energia',        
   'Rezistența la insulină la normoponderali, post intermitent, ordinea meselor.',
   null,                                                     77, true)
) as v(position, slug, title, summary, instrument, offset_days, is_bonus)
on conflict (program_id, slug) do update
  set title            = excluded.title,
      summary          = excluded.summary,
      instrument       = excluded.instrument,
      drip_offset_days = excluded.drip_offset_days,
      position         = excluded.position,
      is_bonus         = excluded.is_bonus;


-- ───────────────────────────── lecțiile ─────────────────────────────
-- Toate cele 31 sunt filmate și urcate pe Vimeo (foldere Modulul 1–5).
-- Titlurile și duratele sunt cele de pe Vimeo, la 30 sept 2026.
-- Modulele 6–12 se adaugă pe măsură ce se filmează.

with m as (
  select mo.id, mo.slug
  from public.modules mo
  join public.programs p on p.id = mo.program_id
  where p.slug = 'cele-7-etape'
)
insert into public.lessons (module_id, position, title, video_id, duration_seconds, video_provider)
select m.id, v.position, v.title, v.video_id, v.secs, 'vimeo'
from (values
  ('harta', 1, 'Bun venit: cum lucrezi cu programul',                     '1230839165',  252),
  ('harta', 2, 'De ce protocoalele izolate eșuează',                      '1230839166',  428),
  ('harta', 3, 'Principiul ierarhiei: cele 7 etape',                      '1230847542',  485),
  ('harta', 4, 'Cum se citește harta',                                    '1231327995',  380),
  ('harta', 5, 'Studiu de caz: Maria, 44 de ani',                         '1231356109',  445),
  ('harta', 6, 'Instrumentul: autoevaluarea pe 7 etape',                  '1231327994',  283),
  ('celula-aparare', 1, 'Mitocondriile, pe înțelesul tuturor',                     '1231387702',  950),
  ('celula-aparare', 2, 'Răspunsul celular la pericol: ipoteza Naviaux',           '1231400163',  548),
  ('celula-aparare', 3, 'Oboseala post-virală: ce se știe și ce nu',               '1230119154',  342),
  ('celula-aparare', 4, 'Instrumentul: jurnalul de energie pe 7 zile',             '1230119175',  336),
  ('etapa-1-mediul', 1, 'Robinetul: de ce mediul e primul',                        '1230126947',  456),
  ('etapa-1-mediul', 2, 'Mâncarea ultraprocesată',                                 '1230126949',  363),
  ('etapa-1-mediul', 3, 'Alcoolul: cifra mare și studiul care ne contrazice',      '1230126946',  369),
  ('etapa-1-mediul', 4, 'Mucegaiul și umezeala: ce e dovedit și ce nu rezistă',    '1230127846',  442),
  ('etapa-1-mediul', 5, 'Metale grele, pesticide, apă: ce se testează și ce nu',   '1230126948',  362),
  ('etapa-1-mediul', 6, 'Instrumentul: checklist de mediu + planul de 21 de zile', '1230127622',  372),
  ('etapa-2-corpul-fizic', 1, 'Analizele „în limite”',                                   '1230131373',  423),
  ('etapa-2-corpul-fizic', 2, 'Microbiomul și intestinul permeabil',                     '1230131372',  419),
  ('etapa-2-corpul-fizic', 3, 'SIBO: diagnostic, tratament, recidivă',                   '1230131376',  397),
  ('etapa-2-corpul-fizic', 4, 'Tiroida și nutrienții: seleniu, iod, vitamina D, gluten', '1230131432',  391),
  ('etapa-2-corpul-fizic', 5, 'Addendum la lecția 4.4 — corecția pe gluten',             '1230131375',  116),
  ('etapa-2-corpul-fizic', 6, 'Insulina și energia',                                     '1230131444',  446),
  ('etapa-2-corpul-fizic', 7, 'Ordinea intervențiilor la etapa 2',                       '1230131446',  289),
  ('etapa-2-corpul-fizic', 8, 'Instrumentul: PFI simplificat + lista de analize',        '1230131445',  297),
  ('etapa-3-ritmuri', 1, 'Corpul tău nu întreabă „cât”, întreabă „când”',           '1230663406',  411),
  ('etapa-3-ritmuri', 2, 'Lumina: singurul buton care mută ceasul',                 '1230663407',  378),
  ('etapa-3-ritmuri', 3, 'Ce repară somnul, și povestea care circulă',              '1230669703',  315),
  ('etapa-3-ritmuri', 4, 'Cofeina și alcoolul: două substanțe, două efecte diferite', '1230663408',  391),
  ('etapa-3-ritmuri', 5, 'Ce funcționează pentru insomnie, în ordinea dovezii',     '1230681130',  430),
  ('etapa-3-ritmuri', 6, 'Sistemul nervos: ce măsoară HRV și ce nu',                '1230690960',  413),
  ('etapa-3-ritmuri', 7, 'Protocolul de 14 zile pentru etajul 3',                   '1230715088',  374)
) as v(module_slug, position, title, video_id, secs)
join m on m.slug = v.module_slug
on conflict (module_id, position) do update
  set title            = excluded.title,
      video_id         = excluded.video_id,
      duration_seconds = excluded.duration_seconds,
      video_provider   = excluded.video_provider;


-- ───────────────────────────── prețurile Stripe ─────────────────────────────
-- Id-uri reale, contul Leadership2gether SRL (live).

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
