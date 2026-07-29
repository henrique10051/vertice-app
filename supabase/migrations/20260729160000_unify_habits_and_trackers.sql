-- Migration to Unify Habits and Custom Trackers

-- 1. Add columns to public.custom_trackers to support Habit-based properties
ALTER TABLE public.custom_trackers
  ADD COLUMN IF NOT EXISTS is_habit BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 2. Migrate existing habits to custom_trackers (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habits') THEN
    INSERT INTO public.custom_trackers (
      id, user_id, name, validation, view_type, is_habit, frequency, scheduled_time, duration_minutes, description, created_at, updated_at
    )
    SELECT 
      id,
      user_id,
      title AS name,
      '[]'::jsonb AS validation, -- Habits have an empty schema-driven validation
      'card' AS view_type,
      TRUE AS is_habit,
      frequency,
      scheduled_time,
      duration_minutes,
      description,
      created_at,
      created_at AS updated_at
    FROM public.habits
    ON CONFLICT (id) DO UPDATE SET
      is_habit = TRUE,
      frequency = EXCLUDED.frequency,
      scheduled_time = EXCLUDED.scheduled_time,
      duration_minutes = EXCLUDED.duration_minutes,
      description = EXCLUDED.description;
  END IF;
END $$;

-- 3. Migrate existing habit_logs to custom_tracker_entries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habit_logs') THEN
    INSERT INTO public.custom_tracker_entries (id, user_id, tracker_id, date, values, created_at, updated_at)
    SELECT 
      id,
      user_id,
      habit_id AS tracker_id,
      date::text AS date,
      '{"is_completed": true}'::jsonb AS values,
      completed_at AS created_at,
      completed_at AS updated_at
    FROM public.habit_logs
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 4. Update foreign key constraints pointing to public.habits
-- Update public.pomodoro_logs:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pomodoro_logs_habit_id_fkey') THEN
    ALTER TABLE public.pomodoro_logs DROP CONSTRAINT pomodoro_logs_habit_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pomodoro_logs') THEN
    ALTER TABLE public.pomodoro_logs
      ADD CONSTRAINT pomodoro_logs_habit_id_fkey 
      FOREIGN KEY (habit_id) REFERENCES public.custom_trackers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Drop old tables safely
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
