-- Add health and study roadmap columns to profiles
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS weight_kg DECIMAL;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS health_goals TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS study_roadmap JSONB DEFAULT '[]'::jsonb;

-- Create health_logs table if not exists
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calories_consumed INTEGER DEFAULT 0,
  water_intake_ml INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS on health_logs
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_logs
DROP POLICY IF EXISTS "health_logs_select_own" ON public.health_logs;
CREATE POLICY "health_logs_select_own" ON public.health_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "health_logs_insert_own" ON public.health_logs;
CREATE POLICY "health_logs_insert_own" ON public.health_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "health_logs_update_own" ON public.health_logs;
CREATE POLICY "health_logs_update_own" ON public.health_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "health_logs_delete_own" ON public.health_logs;
CREATE POLICY "health_logs_delete_own" ON public.health_logs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON public.health_logs(user_id);

-- Storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meal-photos bucket
DROP POLICY IF EXISTS "meal_photos_insert_own" ON storage.objects;
CREATE POLICY "meal_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "meal_photos_select_own" ON storage.objects;
CREATE POLICY "meal_photos_select_own" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "meal_photos_update_own" ON storage.objects;
CREATE POLICY "meal_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'meal-photos');

-- Seed health data for seed user if exists
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET weight_kg = COALESCE(weight_kg, 75),
        height_cm = COALESCE(height_cm, 175),
        age = COALESCE(age, 30),
        gender = COALESCE(gender, 'male'),
        activity_level = COALESCE(activity_level, 'moderate')
    WHERE id = existing_user_id;

    INSERT INTO public.health_logs (user_id, date, calories_consumed, water_intake_ml)
    VALUES (existing_user_id, CURRENT_DATE, 1200, 1000)
    ON CONFLICT (user_id, date) DO NOTHING;
  END IF;
END $$;
