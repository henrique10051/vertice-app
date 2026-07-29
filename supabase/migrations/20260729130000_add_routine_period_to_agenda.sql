-- Add routine_period to agenda_tasks for separating routine parts of the day (morning, afternoon, night)
ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS routine_period TEXT;

ALTER TABLE public.agenda_tasks
  DROP CONSTRAINT IF EXISTS agenda_tasks_routine_period_check;

ALTER TABLE public.agenda_tasks
  ADD CONSTRAINT agenda_tasks_routine_period_check
  CHECK (routine_period IN ('morning', 'afternoon', 'night'));
