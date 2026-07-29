-- Workout tracking: exercise catalog, sessions, and sets (load progression)

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = built-in catalog exercise
  name TEXT NOT NULL,
  muscle_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  rpe NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- exercises: users see built-in catalog (user_id IS NULL) + their own custom exercises
DROP POLICY IF EXISTS "exercises_select_own_or_catalog" ON public.exercises;
CREATE POLICY "exercises_select_own_or_catalog" ON public.exercises
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "exercises_insert_own" ON public.exercises;
CREATE POLICY "exercises_insert_own" ON public.exercises
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "exercises_update_own" ON public.exercises;
CREATE POLICY "exercises_update_own" ON public.exercises
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "exercises_delete_own" ON public.exercises;
CREATE POLICY "exercises_delete_own" ON public.exercises
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- workout_sessions: strictly per-user
DROP POLICY IF EXISTS "workout_sessions_select_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_select_own" ON public.workout_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sessions_insert_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_insert_own" ON public.workout_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sessions_update_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_update_own" ON public.workout_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sessions_delete_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_delete_own" ON public.workout_sessions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- workout_sets: strictly per-user
DROP POLICY IF EXISTS "workout_sets_select_own" ON public.workout_sets;
CREATE POLICY "workout_sets_select_own" ON public.workout_sets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sets_insert_own" ON public.workout_sets;
CREATE POLICY "workout_sets_insert_own" ON public.workout_sets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sets_update_own" ON public.workout_sets;
CREATE POLICY "workout_sets_update_own" ON public.workout_sets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_sets_delete_own" ON public.workout_sets;
CREATE POLICY "workout_sets_delete_own" ON public.workout_sets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_workout_sets_user_id ON public.workout_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_id ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);

-- Seed a small built-in exercise catalog (shared, user_id NULL)
INSERT INTO public.exercises (name, muscle_group, user_id)
SELECT name, muscle_group, NULL FROM (VALUES
  ('Supino Reto', 'Peito'),
  ('Supino Inclinado', 'Peito'),
  ('Agachamento Livre', 'Pernas'),
  ('Leg Press', 'Pernas'),
  ('Levantamento Terra', 'Posterior'),
  ('Puxada Alta', 'Costas'),
  ('Remada Curvada', 'Costas'),
  ('Desenvolvimento Militar', 'Ombro'),
  ('Elevação Lateral', 'Ombro'),
  ('Rosca Direta', 'Bíceps'),
  ('Tríceps Corda', 'Tríceps'),
  ('Abdominal Supra', 'Core')
) AS seed(name, muscle_group)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE user_id IS NULL);
