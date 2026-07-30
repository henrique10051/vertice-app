-- Fix: 20260729140000 created custom_trackers with an older column set
-- (fields_schema, category, habit_id) before 20260729150000 introduced the
-- schema-driven columns actually used by useCustomTrackersStore
-- (category_id, validation, view_type). Because 150000 uses
-- CREATE TABLE IF NOT EXISTS, it silently no-ops on the table created by
-- 140000, leaving it without the columns the live /rastreadores page needs.
ALTER TABLE public.custom_trackers
  ADD COLUMN IF NOT EXISTS category_id TEXT
    CHECK (category_id IN ('pessoal', 'trabalho', 'saude', 'financas', 'outro'));

ALTER TABLE public.custom_trackers
  ADD COLUMN IF NOT EXISTS validation JSONB;

ALTER TABLE public.custom_trackers
  ADD COLUMN IF NOT EXISTS view_type TEXT DEFAULT 'card'
    CHECK (view_type IN ('card', 'list', 'table'));

ALTER TABLE public.custom_trackers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
