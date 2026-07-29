-- Add recurrence to agenda_tasks to support weekly routine repeating
ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS days_of_week TEXT[] DEFAULT '{}'::text[];

-- Add indices for querying recurring tasks efficiently
CREATE INDEX IF NOT EXISTS idx_agenda_tasks_days_of_week ON public.agenda_tasks USING gin (days_of_week);
CREATE INDEX IF NOT EXISTS idx_agenda_tasks_is_recurring ON public.agenda_tasks(is_recurring);
