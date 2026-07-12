-- Create habit_logs table for tracking daily habit completion history
-- Note: habits table may not exist yet, so we handle the FK conditionally
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)
);

-- Add FK to habits table only if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habits') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_id_fkey'
    ) THEN
      ALTER TABLE public.habit_logs
        ADD CONSTRAINT habit_logs_habit_id_fkey
        FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "habit_logs_select_own" ON public.habit_logs;
CREATE POLICY "habit_logs_select_own" ON public.habit_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "habit_logs_insert_own" ON public.habit_logs;
CREATE POLICY "habit_logs_insert_own" ON public.habit_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habit_logs_update_own" ON public.habit_logs;
CREATE POLICY "habit_logs_update_own" ON public.habit_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habit_logs_delete_own" ON public.habit_logs;
CREATE POLICY "habit_logs_delete_own" ON public.habit_logs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON public.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);

-- Seed habit_logs for existing user's habits (only if habits table exists)
DO $$
DECLARE
  existing_user_id uuid;
  habit_rec RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habits') THEN
    RETURN;
  END IF;

  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    FOR habit_rec IN SELECT id FROM public.habits WHERE user_id = existing_user_id LOOP
      INSERT INTO public.habit_logs (user_id, habit_id, date, completed_at)
      VALUES (existing_user_id, habit_rec.id, CURRENT_DATE, NOW())
      ON CONFLICT (user_id, habit_id, date) DO NOTHING;
    END LOOP;
  END IF;
END $$;
