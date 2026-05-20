-- ============================================================
-- Inginerii Creierului — Schema Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'cursant' CHECK (role IN ('cursant', 'admin')),
  -- săptămâna curentă (1-24)
  week        SMALLINT NOT NULL DEFAULT 1 CHECK (week BETWEEN 1 AND 24),
  -- protocoale personalizate
  flags       JSONB NOT NULL DEFAULT '{
    "sibo": false,
    "candidoza": false,
    "rezistenta_insulina": false,
    "tiroida": false
  }'::jsonb,
  -- datele de start salvate de admin
  saved_dates JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Utilizatorul îşi poate vedea/edita propriul profil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper: verifică dacă utilizatorul curent este admin fără să treacă prin RLS
-- SECURITY DEFINER = rulează ca owner (postgres), ocolind RLS → evită recursivitatea
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admin poate vedea toate profilurile
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Trigger: auto-creare profil la înregistrare
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = current_setting('app.admin_email', true)
         THEN 'admin' ELSE 'cursant' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DAILY REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date     DATE NOT NULL,
  -- Checklist mese: breakfast, lunch, dinner, snack1, snack2
  checks   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Slidere 1-10: energie, somn, stres, stare_generala, productivitate
  sliders  JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Simptome: [{name, severity}]
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_reports_user_date_unique UNIQUE (user_id, date)
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_reports_own" ON public.daily_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "daily_reports_admin" ON public.daily_reports
  FOR ALL USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,  -- 'daily_reminder' | 'weekly_summary' | 'inactivity_alert' | 'manual'
  channel    TEXT NOT NULL DEFAULT 'email',
  message    TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_admin" ON public.notifications
  FOR ALL USING (public.is_admin());

-- ============================================================
-- SCHEDULED NOTIFICATIONS (pentru trimitere programată)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids      UUID[] NOT NULL,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent          BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_notifications_admin" ON public.scheduled_notifications
  FOR ALL USING (public.is_admin());

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View: ultimul raport per cursant
CREATE OR REPLACE VIEW public.last_report_per_user AS
SELECT DISTINCT ON (user_id)
  user_id,
  date   AS last_report_date,
  saved_at
FROM public.daily_reports
ORDER BY user_id, date DESC;

-- View: statistici admin dashboard
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  p.id,
  p.name,
  p.email,
  p.week,
  p.flags,
  p.created_at,
  lr.last_report_date,
  lr.saved_at AS last_saved_at,
  (CURRENT_DATE - lr.last_report_date) AS days_since_report,
  (
    SELECT COUNT(*)::int
    FROM public.daily_reports dr
    WHERE dr.user_id = p.id
      AND dr.date >= CURRENT_DATE - INTERVAL '30 days'
  ) AS reports_last_30_days
FROM public.profiles p
LEFT JOIN public.last_report_per_user lr ON lr.user_id = p.id
WHERE p.role = 'cursant';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date
  ON public.daily_reports (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date
  ON public.daily_reports (date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled
  ON public.scheduled_notifications (scheduled_for)
  WHERE sent = FALSE;

-- ============================================================
-- ADMIN MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  video_url    TEXT,
  -- 'all' | 'phase' | 'protocol'
  target_type  TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'phase', 'protocol')),
  -- phase name (e.g. 'Faza 1') or protocol key (e.g. 'tiroida') — null when target_type='all'
  target_value TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_messages_admin" ON public.admin_messages
  FOR ALL USING (public.is_admin());

-- Cursants can read active, published messages (target filtering done in application layer)
CREATE POLICY "admin_messages_cursant_read" ON public.admin_messages
  FOR SELECT USING (is_active = TRUE AND published_at <= NOW());

CREATE INDEX IF NOT EXISTS idx_admin_messages_active
  ON public.admin_messages (is_active, published_at DESC);

-- ============================================================
-- GROUP STATS FUNCTION (for motivational card — SECURITY DEFINER
-- to allow cursants to see aggregate data without exposing individual records)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_group_stats_last7()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'avg_reports', ROUND(COALESCE(AVG(cnt), 0), 1),
    'max_reports', COALESCE(MAX(cnt), 0),
    'total_users', COUNT(*)
  )
  FROM (
    SELECT user_id, COUNT(*)::int AS cnt
    FROM public.daily_reports
    WHERE date >= CURRENT_DATE - 6
      AND user_id IN (SELECT id FROM public.profiles WHERE role = 'cursant')
    GROUP BY user_id
  ) sub
$$;

-- ============================================================
-- GROUP CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            TEXT,
  image_url       TEXT,
  image_path      TEXT,
  message_type    TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'announcement')),
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  is_announcement BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gcm_has_content CHECK (body IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read non-deleted messages
CREATE POLICY "gcm_read" ON public.group_chat_messages
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

-- Users can only insert their own messages
CREATE POLICY "gcm_insert" ON public.group_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Only admins can update (pin, announce, soft-delete)
CREATE POLICY "gcm_admin_update" ON public.group_chat_messages
  FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_gcm_created_at
  ON public.group_chat_messages (created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gcm_pinned
  ON public.group_chat_messages (is_pinned) WHERE is_pinned = TRUE AND deleted_at IS NULL;

-- ============================================================
-- STORAGE: chat-images bucket (create manually in Supabase Dashboard)
-- Bucket settings: public=true, file size limit=5242880 (5MB)
-- Allowed MIME: image/jpeg, image/png, image/webp
-- Then run these storage policies:
-- ============================================================
-- CREATE POLICY "chat_images_public_select" ON storage.objects
--   FOR SELECT USING (bucket_id = 'chat-images');
-- CREATE POLICY "chat_images_auth_insert" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'chat-images' AND auth.uid() IS NOT NULL
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "chat_images_admin_delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'chat-images' AND public.is_admin());

-- ============================================================
-- SEED: setează admin-ul implicit
-- Rulează după ce userul s-a autentificat prima dată
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = '2getheromania@gmail.com';
