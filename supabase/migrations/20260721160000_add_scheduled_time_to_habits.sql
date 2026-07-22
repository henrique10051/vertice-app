-- Allow habits to have a fixed time of day so they can appear in the Agenda grid
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS scheduled_time TIME;
