-- Verify habits table RLS policies are correctly set for authenticated users
-- This ensures users can only create/read/update/delete their own habits

ALTER TABLE IF EXISTS public.habits ENABLE ROW LEVEL SECURITY;

-- Ensure INSERT policy exists for authenticated users
DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;
CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE TO authenticated USING (user_id = auth.uid());
