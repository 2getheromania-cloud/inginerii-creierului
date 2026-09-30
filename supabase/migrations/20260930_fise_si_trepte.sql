-- ════════════════════════════════════════════════════════════════════
--  Cele 7 Etape — fișele în platformă + separarea celor două trepte
--  30 septembrie 2026. Rulat în producție în aceeași zi.
--
--  ORDINEA, dacă se reconstruiește baza de la zero:
--    1. supabase/migrations/20260925_drip_platform.sql
--    2. supabase/seed/cele-7-etape.sql          (creează cele 12 module)
--    3. fișierul acesta                          (leagă fișele de module)
--  Ultima parte face un join pe modulele existente, deci seed-ul trebuie
--  să fi rulat înainte, altfel nu se inserează nicio fișă.
--
--  CE REPARĂ. Până la el, coloana enrollments.tier se scria la plată și n-o
--  citea nimeni. Cine plătea „Harta" și cine plătea „Harta + Instrumente"
--  primeau exact același lucru: instrumentele nu existau nicăieri în bază,
--  erau doar un rând de text pe cardul modulului, vizibil tuturor.
--  Diferența de 400 de lei era vândută, dar nu era livrată.
--
--  La final iese un rând de verificare: 12, 11, 4, 0, 0.
-- ════════════════════════════════════════════════════════════════════


-- ───────────────────────── 1. ordinea treptelor ─────────────────────────
-- 'harta' < 'harta_instrumente' < 'ghidare'. Fără funcția asta nu se poate
-- compara o treaptă cu alta într-o politică RLS.

create or replace function public.tier_rank(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
           when 'harta'             then 1
           when 'harta_instrumente' then 2
           when 'ghidare'           then 3
           else 0
         end
$$;


-- ───────────────────────── 2. fișele ─────────────────────────

create table if not exists public.resources (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references public.programs(id) on delete cascade,
  module_id      uuid          references public.modules(id)  on delete set null,
  position       int  not null,
  slug           text not null,
  title          text not null,
  kind           text not null default 'fisa'
                   check (kind in ('fisa','plansa','audio','link')),
  -- pagina din platformă care o afișează
  path           text,
  -- treapta minimă care o poate deschide
  min_tier       text not null default 'harta_instrumente'
                   check (min_tier in ('harta','harta_instrumente','ghidare')),
  -- true  = se completează în platformă și răspunsurile rămân în cont
  -- false = se tipărește și rămâne la om; nu există unde să se salveze
  saves_answers  boolean not null default false,
  note           text,
  created_at     timestamptz not null default now(),
  unique (program_id, slug),
  unique (program_id, position)
);

create index if not exists resources_module_idx on public.resources(module_id);


-- ───────────────────────── 3. ce completează omul ─────────────────────────
-- Un singur rând per om per fișă, rescris la fiecare salvare.
-- jsonb, ca să nu facem 12 tabele pentru 12 formulare.

create table if not exists public.resource_entries (
  user_id     uuid not null references auth.users(id)       on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, resource_id)
);


-- ───────────────────────── 4. RLS ─────────────────────────

alter table public.resources        enable row level security;
alter table public.resource_entries enable row level security;

-- RLS filtrează rândurile, dar dacă rolul n-are drept pe tabel nu vede nimic,
-- oricâte politici ar exista. De aceea drepturile sunt scrise explicit.
grant select on public.resources to authenticated;
grant select, insert, update, delete on public.resource_entries to authenticated;

-- Fișa se vede dacă, toate deodată:
--   · omul e înscris, activ, în perioada de acces;
--   · treapta lui e cel puțin cea cerută de fișă;
--   · modulul de care ține fișa s-a deschis deja (drip).
drop policy if exists "resources of unlocked modules and paid tier" on public.resources;
create policy "resources of unlocked modules and paid tier"
  on public.resources for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      left join public.modules m on m.id = resources.module_id
      where e.user_id    = auth.uid()
        and e.program_id = resources.program_id
        and e.status     = 'active'
        and now() <  e.access_until
        and public.tier_rank(e.tier) >= public.tier_rank(resources.min_tier)
        and (
          m.id is null
          or now() >= e.enrolled_at + make_interval(days => m.drip_offset_days)
        )
    )
  );

drop policy if exists "own entries read" on public.resource_entries;
create policy "own entries read"
  on public.resource_entries for select
  to authenticated
  using (user_id = auth.uid());

-- Se scrie numai pe fișele care au voie să salveze. Blocajul stă în bază:
-- o greșeală în interfață nu poate ajunge să scrie răspunsurile de la ACE.
drop policy if exists "own entries write" on public.resource_entries;
create policy "own entries write"
  on public.resource_entries for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.resources r
      where r.id = resource_entries.resource_id
        and r.saves_answers
    )
  );

drop policy if exists "own entries update" on public.resource_entries;
create policy "own entries update"
  on public.resource_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.resources r
      where r.id = resource_entries.resource_id
        and r.saves_answers
    )
  );

drop policy if exists "own entries delete" on public.resource_entries;
create policy "own entries delete"
  on public.resource_entries for delete
  to authenticated
  using (user_id = auth.uid());


-- ───────────────────────── 5. vederile pentru platformă ─────────────────────────
-- security_invoker = true e obligatoriu. Fără el vederea rulează cu drepturile
-- proprietarului și ocolește RLS complet.

create or replace view public.my_resources
with (security_invoker = true)
as
select
  r.id,
  r.program_id,
  r.module_id,
  m.position as module_position,
  r.position,
  r.slug,
  r.title,
  r.kind,
  r.path,
  r.saves_answers,
  (e2.data is not null) as started
from public.resources r
left join public.modules m on m.id = r.module_id
left join public.resource_entries e2
       on e2.resource_id = r.id and e2.user_id = auth.uid()
order by r.position;

grant select on public.my_resources to authenticated;

-- my_modules primește două coloane noi: treapta omului și dacă instrumentul
-- modulului îi e deschis. Cine e pe „Harta" vede numele instrumentului și un
-- lacăt, nu un link mort.
--
-- Se șterge și se reface, nu „create or replace": Postgres nu acceptă coloane
-- noi la mijlocul unei vederi existente. Vederea nu ține date, doar le arată.
drop view if exists public.my_modules;
create view public.my_modules
with (security_invoker = true)
as
select
  m.id,
  m.program_id,
  m.position,
  m.slug,
  m.title,
  m.summary,
  m.instrument,
  m.is_bonus,
  e.tier,
  (public.tier_rank(e.tier) >= public.tier_rank('harta_instrumente')) as has_instruments,
  e.enrolled_at + make_interval(days => m.drip_offset_days) as unlock_at,
  now() >= e.enrolled_at + make_interval(days => m.drip_offset_days) as unlocked
from public.modules m
join public.enrollments e
  on e.program_id = m.program_id
 and e.user_id    = auth.uid()
 and e.status     = 'active'
 and now() < e.access_until
order by m.position;

grant select on public.my_modules to authenticated;


-- ───────────────────────── 6. cele douăsprezece fișe ─────────────────────────
--
-- saves_answers = false la fișele 8, 9, 10 și 11. Regula, scrisă o dată:
-- se salvează cifrele, nu confesiunile. ACE-ul, convingerile, genograma și
-- valorile ating copilăria, familia și credința. Nu le ținem.
--
-- Fișa 1 e testul public de pe site, deci min_tier = 'harta'.

with p as (select id from public.programs where slug = 'cele-7-etape')
insert into public.resources
  (program_id, module_id, position, slug, title, kind, path, min_tier, saves_answers, note)
select
  p.id,
  m.id,
  v.pos, v.slug, v.title, 'fisa', v.path, v.min_tier, v.saves, v.note
from p
cross join (values
  ( 1, 'autoevaluare-7-etape', 'Autoevaluarea pe 7 etape',
    'harta',              1, true,
    'https://ingineriicreierului.ro/autoevaluare/',
    'Testul public de pe site. Rămâne gratuit: e cel mai bun magnet către program.'),
  ( 2, 'jurnal-energie', 'Jurnalul de energie pe 7 zile',
    'harta_instrumente',  2, true,
    '/cele-7-etape/fise/jurnal-energie',
    'Se completează 7 zile. Trei cifre pe zi.'),
  ( 3, 'checklist-mediu', 'Checklistul de mediu',
    'harta_instrumente',  3, true,
    '/cele-7-etape/fise/checklist-mediu',
    'Bifele rămân în cont; din ele se face fișa 12.'),
  ( 4, 'plan-21-zile', 'Planul de eliminare în 21 de zile',
    'harta_instrumente',  3, true,
    '/cele-7-etape/fise/plan-21-zile',
    'O singură schimbare pe săptămână.'),
  ( 5, 'pfi-simplificat', 'PFI simplificat',
    'harta_instrumente',  4, true,
    '/cele-7-etape/fise/pfi-simplificat',
    'Podul dintre autoevaluare și planul pe 6 luni.'),
  ( 6, 'lista-analize', 'Lista de analize pentru medic',
    'harta_instrumente',  4, true,
    '/cele-7-etape/fise/lista-analize',
    'Se salvează doar lista bifată, fără rezultate. Rezultatele sunt date medicale.'),
  ( 7, 'ritm-14-zile', 'Fișa de ritm pe 14 zile',
    'harta_instrumente',  5, true,
    '/cele-7-etape/fise/ritm-14-zile',
    'Se salvează sinteza de la final, nu cele 14 rânduri.'),
  ( 8, 'ace-reglare', 'Chestionarul ACE și cele trei exerciții de reglare',
    'harta_instrumente',  6, false,
    '/cele-7-etape/fise/ace-reglare',
    'NU se salvează. Abuz în copilărie, dependență, violență în familie.'),
  ( 9, 'convingeri', 'Cartografierea convingerilor',
    'harta_instrumente',  7, false,
    '/cele-7-etape/fise/convingeri',
    'NU se salvează.'),
  (10, 'genograma', 'Genograma pe trei generații',
    'harta_instrumente',  8, false,
    '/cele-7-etape/fise/genograma',
    'NU se salvează. Boli și tipare din familia omului.'),
  (11, 'valori-ritual', 'Exercițiul de valori și ritualul de sens',
    'harta_instrumente',  9, false,
    '/cele-7-etape/fise/valori-ritual',
    'NU se salvează. Valori și credință.'),
  (12, 'plan-6-luni', 'Planul personal de lucru pe 6 luni',
    'harta_instrumente', 10, true,
    '/cele-7-etape/fise/plan-6-luni',
    'Se completează singur din fișele 1, 3, 4, 5 și 7.')
) as v(pos, slug, title, min_tier, module_position, saves, path, note)
join public.modules m
  on m.program_id = p.id and m.position = v.module_position
on conflict (program_id, slug) do update
  set module_id     = excluded.module_id,
      position      = excluded.position,
      title         = excluded.title,
      path          = excluded.path,
      min_tier      = excluded.min_tier,
      saves_answers = excluded.saves_answers,
      note          = excluded.note;


-- ───────────────────────── 7. verificarea ─────────────────────────
-- Un singur rând. Trebuie să arate exact: 12, 11, 4, 0, 0.

select
  (select count(*) from public.resources r
     join public.programs p on p.id = r.program_id
    where p.slug = 'cele-7-etape')                                   as fise_total,
  (select count(*) from public.resources r
     join public.programs p on p.id = r.program_id
    where p.slug = 'cele-7-etape'
      and r.min_tier = 'harta_instrumente')                          as doar_cu_instrumente,
  (select count(*) from public.resources r
     join public.programs p on p.id = r.program_id
    where p.slug = 'cele-7-etape'
      and not r.saves_answers)                                       as nu_se_salveaza,
  (select count(*) from public.resources r
     join public.programs p on p.id = r.program_id
    where p.slug = 'cele-7-etape' and r.module_id is null)           as fara_modul,
  (select count(*) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('my_modules','my_resources')
      and coalesce(array_to_string(c.reloptions, ','), '')
          not ilike '%security_invoker=true%')                       as vederi_nesigure;
