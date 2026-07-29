-- Persisted AI-suggested workout schedule, kept within the Treino tab (not linked to habits)

CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_plans_select_own" ON public.workout_plans;
CREATE POLICY "workout_plans_select_own" ON public.workout_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_plans_insert_own" ON public.workout_plans;
CREATE POLICY "workout_plans_insert_own" ON public.workout_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_plans_update_own" ON public.workout_plans;
CREATE POLICY "workout_plans_update_own" ON public.workout_plans
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_plans_delete_own" ON public.workout_plans;
CREATE POLICY "workout_plans_delete_own" ON public.workout_plans
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
