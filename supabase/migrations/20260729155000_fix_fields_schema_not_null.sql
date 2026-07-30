-- Fix: 20260729140000 created custom_trackers.fields_schema as NOT NULL with
-- no default. That column belongs to the abandoned old trackers schema and is
-- unused by the app, but its NOT NULL constraint blocks
-- 20260729160000_unify_habits_and_trackers.sql's INSERT (which never sets it),
-- failing on any account with real habits data.
ALTER TABLE public.custom_trackers
  ALTER COLUMN fields_schema DROP NOT NULL,
  ALTER COLUMN fields_schema SET DEFAULT '[]'::jsonb;
