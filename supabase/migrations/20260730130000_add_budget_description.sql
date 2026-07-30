-- Add optional description field to budgets so users can add context to a forecast entry
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS description TEXT;
