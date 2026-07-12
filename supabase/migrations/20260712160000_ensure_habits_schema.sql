CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  frequency TEXT DEFAULT 'daily',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_id_fkey'
  ) THEN
    ALTER TABLE public.habit_logs
      ADD CONSTRAINT habit_logs_habit_id_fkey
      FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;
CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
