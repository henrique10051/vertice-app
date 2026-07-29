-- Timezone per user, needed to compare habits.scheduled_time (a plain TIME with no
-- timezone) against wall-clock time in send-reminders instead of UTC.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- Web Push subscriptions, one row per browser/device the user has enabled notifications on.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Dedupe log so a habit/task never gets more than one push per day, even if the
-- send-reminders cron overlaps itself. Only the service role (Edge Function) touches
-- this table, so it stays RLS-enabled with no policies (nobody with the anon/authenticated
-- role can read or write it).
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('habit', 'agenda_task')),
  source_id UUID NOT NULL,
  reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_type, source_id, reminder_date)
);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- pg_cron/pg_net are standard Supabase extensions; if this fails due to permissions,
-- enable them manually via Dashboard -> Database -> Extensions.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- The actual `cron.schedule('send-reminders', ...)` call is run as a one-off SQL
-- statement at deploy time (not in this migration file) because it needs the project's
-- service_role key as a bearer token, and that must never be committed to git. The
-- service_role key is stored in Supabase Vault (`vault.create_secret`) and referenced by
-- name from the cron job body instead of being inlined here. See deploy notes.
