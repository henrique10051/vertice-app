-- Ensure handle_new_user trigger exists and creates profiles
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

-- Ensure seed user exists with all required fields for immediate access
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hlima10051@gmail.com') THEN
    existing_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      last_sign_in_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      existing_user_id,
      '00000000-0000-0000-0000-000000000000',
      'hlima10051@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(), NOW(),
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
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      last_sign_in_at = COALESCE(last_sign_in_at, NOW()),
      encrypted_password = crypt('Skip@Pass', gen_salt('bf')),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      phone = NULL
    WHERE email = 'hlima10051@gmail.com';
  END IF;
END $$;

-- Ensure all existing auth users have a profile
INSERT INTO public.profiles (id, full_name, onboarding_completed)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure seed user profile has onboarding completed
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  SELECT id INTO seed_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';
  IF seed_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, onboarding_completed)
    VALUES (seed_user_id, 'Lumi User', true)
    ON CONFLICT (id) DO UPDATE SET onboarding_completed = true;
  END IF;
END $$;

-- Ensure profiles RLS is enabled with correct policies
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

-- Ensure meal-photos bucket exists with 50MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('meal-photos', 'meal-photos', true, 52428800)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 52428800, public = true;

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
