-- Add category to agenda_tasks for color-coded filtering
ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'pessoal';

ALTER TABLE public.agenda_tasks
  DROP CONSTRAINT IF EXISTS agenda_tasks_category_check;

ALTER TABLE public.agenda_tasks
  ADD CONSTRAINT agenda_tasks_category_check
  CHECK (category IN ('pessoal', 'trabalho', 'saude', 'financas', 'outro'));
