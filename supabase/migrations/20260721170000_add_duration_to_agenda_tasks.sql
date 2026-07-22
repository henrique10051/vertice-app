-- Add duration to agenda_tasks so events can span more than a single hour slot
ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

ALTER TABLE public.agenda_tasks
  DROP CONSTRAINT IF EXISTS agenda_tasks_duration_minutes_check;

ALTER TABLE public.agenda_tasks
  ADD CONSTRAINT agenda_tasks_duration_minutes_check
  CHECK (duration_minutes > 0 AND duration_minutes <= 1440);
