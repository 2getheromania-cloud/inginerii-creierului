-- ============================================================
-- 1) Dezactivare cursant  +  2) Reparare ștergere cursant
-- Rulează o singură dată în Supabase → SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Coloana `active` pe profiles
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Index parțial — lista de admin filtrează des după conturi dezactivate
CREATE INDEX IF NOT EXISTS idx_profiles_inactive
  ON public.profiles (active) WHERE active = FALSE;

-- ------------------------------------------------------------
-- 2. Fix „Database error deleting user”
--
-- Cauza: unele tabele referă auth.users(id) sau public.profiles(id)
-- cu ON DELETE NO ACTION (implicit). La ștergerea userului din
-- auth.users, Postgres blochează operația din cauza rândurilor rămase
-- (push_subscriptions, documents, group_chat_messages, reacții etc.),
-- iar GoTrue raportează generic „Database error deleting user”.
--
-- Blocul de mai jos recreează TOATE cheile străine din schema public
-- care indică spre auth.users sau public.profiles, cu ON DELETE CASCADE.
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  base_def TEXT;
BEGIN
  FOR r IN
    SELECT
      c.conname,
      c.conrelid::regclass AS tbl,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class     src  ON src.oid  = c.conrelid
    JOIN pg_namespace srcn ON srcn.oid = src.relnamespace
    JOIN pg_class     ref  ON ref.oid  = c.confrelid
    JOIN pg_namespace refn ON refn.oid = ref.relnamespace
    WHERE c.contype = 'f'
      AND srcn.nspname = 'public'          -- doar tabelele aplicației
      AND c.confdeltype <> 'c'             -- nu e deja ON DELETE CASCADE
      AND (
        (refn.nspname = 'auth'   AND ref.relname = 'users')
        OR
        (refn.nspname = 'public' AND ref.relname = 'profiles')
      )
  LOOP
    -- scoate orice clauză ON DELETE existentă (NO ACTION / RESTRICT / SET NULL / SET DEFAULT)
    base_def := regexp_replace(
      r.def,
      '\s+ON DELETE (NO ACTION|RESTRICT|SET NULL|SET DEFAULT)',
      '', 'gi'
    );

    -- ON DELETE trebuie să apară înaintea unei eventuale clauze DEFERRABLE
    IF base_def ~* 'DEFERRABLE' THEN
      base_def := regexp_replace(base_def, '\s+DEFERRABLE', ' ON DELETE CASCADE DEFERRABLE', 'i');
    ELSE
      base_def := base_def || ' ON DELETE CASCADE';
    END IF;

    RAISE NOTICE 'FK % pe % → ON DELETE CASCADE', r.conname, r.tbl;

    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.tbl, r.conname, base_def);
  END LOOP;
END $$;

-- Verificare: după rulare, lista de mai jos trebuie să fie goală.
-- SELECT conrelid::regclass AS tabel, conname
-- FROM pg_constraint c
-- JOIN pg_class ref ON ref.oid = c.confrelid
-- WHERE c.contype = 'f' AND c.confdeltype <> 'c'
--   AND ref.relname IN ('users', 'profiles');
