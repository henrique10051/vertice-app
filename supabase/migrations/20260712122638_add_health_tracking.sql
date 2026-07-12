-- Add health profile columns to profiles
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS weight_kg DECIMAL;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;

-- Create health_logs table
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories_consumed INTEGER DEFAULT 0,
  water_intake_ml INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "health_logs_select_own" ON public.health_logs;
CREATE POLICY "health_logs_select_own" ON public.health_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "health_logs_insert_own" ON public.health_logs;
CREATE POLICY "health_logs_insert_own" ON public.health_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "health_logs_update_own" ON public.health_logs;
CREATE POLICY "health_logs_update_own" ON public.health_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON public.health_logs(user_id);

-- Seed health data for existing user
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET weight_kg = 75, height_cm = 175, age = 30, gender = 'male', activity_level = 'moderate'
    WHERE id = existing_user_id AND weight_kg IS NULL;

    INSERT INTO public.health_logs (user_id, date, calories_consumed, water_intake_ml)
    VALUES (existing_user_id, CURRENT_DATE, 1200, 1000)
    ON CONFLICT (user_id, date) DO NOTHING;
  END IF;
END $$;
