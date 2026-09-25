-- Cele 7 Etape — schema de programe cu deschidere progresivă relativă
-- Rulează pe instanța Supabase existentă a dashboard-ului IC.
-- Nu atinge nimic din tabelele programului de 6 luni.

-- ───────────────────────────── structura cursului ─────────────────────────────

create table if not exists public.programs (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  drip_interval_days int  not null default 14,
  access_months     int  not null default 12,
  created_at        timestamptz not null default now()
);

create table if not exists public.modules (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references public.programs(id) on delete cascade,
  position         int  not null,
  slug             text not null,
  title            text not null,
  summary          text,
  instrument       text,
  -- zile după data de înscriere a FIECĂRUI om, nu o dată fixă în calendar
  drip_offset_days int  not null,
  is_bonus         boolean not null default false,
  unique (program_id, position),
  unique (program_id, slug)
);

create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules(id) on delete cascade,
  position         int  not null,
  title            text not null,
  video_provider   text not null default 'vimeo',
  video_id         text,
  duration_seconds int,
  unique (module_id, position)
);

-- ───────────────────────────── oameni și acces ─────────────────────────────

create table if not exists public.enrollments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  program_id             uuid not null references public.programs(id),
  tier                   text not null check (tier in ('harta','harta_instrumente','ghidare')),
  enrolled_at            timestamptz not null default now(),
  access_until           timestamptz not null,
  status                 text not null default 'active'
                           check (status in ('active','refunded','cancelled')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_session_id      text unique,
  created_at             timestamptz not null default now(),
  unique (user_id, program_id)
);

create index if not exists enrollments_user_idx    on public.enrollments(user_id);
create index if not exists enrollments_program_idx on public.enrollments(program_id);

create table if not exists public.lesson_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ───────────────────────────── Stripe ─────────────────────────────

-- Maparea preț → treaptă. Tabel, nu variabile de mediu: schimbi prețul fără redeploy.
create table if not exists public.stripe_prices (
  price_id     text primary key,
  program_slug text not null,
  tier         text not null check (tier in ('harta','harta_instrumente','ghidare')),
  -- Numărul de rate, pentru prețurile recurente care sunt plată eșalonată, nu
  -- abonament. Stripe nu știe singur să oprească un abonament după N facturi:
  -- fără numărul ăsta, cine alege „2 × 419 lei" e taxat 419 lei în fiecare lună,
  -- la nesfârșit. Webhook-ul îl citește și pune cancel_at pe abonament.
  -- NULL = abonament continuu (Ghidarea) sau plată unică.
  installments smallint check (installments is null or installments between 2 and 24),
  note         text
);

alter table public.stripe_prices
  add column if not exists installments smallint;

-- Deduplicare: Stripe retrimite același eveniment la orice eșec de rețea.
create table if not exists public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

-- ───────────────────────────── funcții ─────────────────────────────

-- Căutarea utilizatorului după email. auth.users nu e accesibil din clientul
-- normal, iar supabase-js nu are getUserByEmail.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = auth, public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;

revoke execute on function public.get_user_id_by_email(text) from anon, authenticated;

-- Câte module a început omul. Folosit pentru garanția de 14 zile,
-- care se acordă „dacă ai parcurs mai puțin de 3 module".
create or replace function public.modules_started(p_user uuid, p_program uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct m.id)::int
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where lp.user_id = p_user
    and m.program_id = p_program
$$;

-- ───────────────────────────── RLS ─────────────────────────────

alter table public.programs        enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.stripe_prices   enable row level security;
alter table public.stripe_events   enable row level security;

-- programele sunt publice ca listă
drop policy if exists "programs readable" on public.programs;
create policy "programs readable"
  on public.programs for select
  to authenticated
  using (true);

-- înscrierea proprie
drop policy if exists "own enrollment" on public.enrollments;
create policy "own enrollment"
  on public.enrollments for select
  to authenticated
  using (user_id = auth.uid());

-- TITLURILE tuturor modulelor se văd de către cei înscriși, inclusiv ale celor
-- care încă nu s-au deschis: omul trebuie să vadă ce urmează și când.
drop policy if exists "modules of enrolled program" on public.modules;
create policy "modules of enrolled program"
  on public.modules for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.user_id    = auth.uid()
        and e.program_id = modules.program_id
        and e.status     = 'active'
        and now() < e.access_until
    )
  );

-- LECȚIILE, în schimb, doar ale modulelor deja deschise. Aici se aplică drip-ul:
-- fără politica asta, cineva poate citi id-ul video al modulului 9 din ziua întâi.
drop policy if exists "lessons of unlocked modules" on public.lessons;
create policy "lessons of unlocked modules"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1
      from public.modules m
      join public.enrollments e on e.program_id = m.program_id
      where m.id        = lessons.module_id
        and e.user_id   = auth.uid()
        and e.status    = 'active'
        and now() <  e.access_until
        and now() >= e.enrolled_at + make_interval(days => m.drip_offset_days)
    )
  );

-- progresul propriu
drop policy if exists "own progress read" on public.lesson_progress;
create policy "own progress read"
  on public.lesson_progress for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "own progress write" on public.lesson_progress;
create policy "own progress write"
  on public.lesson_progress for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "own progress delete" on public.lesson_progress;
create policy "own progress delete"
  on public.lesson_progress for delete
  to authenticated
  using (user_id = auth.uid());

-- stripe_prices și stripe_events: nicio politică = nimeni în afară de
-- service_role nu le vede. Intenționat.

-- ───────────────────────────── vederea pentru dashboard ─────────────────────────────

-- security_invoker = true este obligatoriu. Fără el vederea rulează cu
-- drepturile proprietarului și ocolește RLS complet.
create or replace view public.my_modules
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
