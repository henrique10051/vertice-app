-- Add duration to habits, matching agenda_tasks, for consistent time-blocking in the Agenda grid
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_duration_minutes_check;

ALTER TABLE public.habits
  ADD CONSTRAINT habits_duration_minutes_check
  CHECK (duration_minutes > 0 AND duration_minutes <= 1440);
