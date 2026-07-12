-- Create profiles table if it does not exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add onboarding_completed column to profiles if table already existed without it
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';

-- Ensure seed user has onboarding completed
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, onboarding_completed)
    VALUES (existing_user_id, 'Lumi User', true)
    ON CONFLICT (id) DO UPDATE SET onboarding_completed = true;
  END IF;
END $$;

-- Update meal-photos bucket to enforce 50MB file size limit (50 * 1024 * 1024 = 52428800 bytes)
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'meal-photos';

-- If bucket doesn't exist yet, create it with the limit
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('meal-photos', 'meal-photos', true, 52428800)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 52428800;

-- Ensure storage policies for meal-photos
DROP POLICY IF EXISTS "meal-photos_upload_own" ON storage.objects;
CREATE POLICY "meal-photos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "meal-photos_read_all" ON storage.objects;
CREATE POLICY "meal-photos_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "meal-photos_delete_own" ON storage.objects;
CREATE POLICY "meal-photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ensure profiles RLS is enabled and policies exist
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Ensure habit_logs RLS is enabled and policies exist
ALTER TABLE IF EXISTS public.habit_logs ENABLE ROW LEVEL SECURITY;

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

-- Ensure the handle_new_user trigger function includes onboarding_completed default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure seed user exists with all correct auth token columns
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hlima10051@gmail.com') THEN
    existing_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      existing_user_id,
      '00000000-0000-0000-0000-000000000000',
      'hlima10051@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Lumi User"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, onboarding_completed)
    VALUES (existing_user_id, 'Lumi User', true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users SET
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      phone = NULL
    WHERE email = 'hlima10051@gmail.com';
  END IF;
END $$;
