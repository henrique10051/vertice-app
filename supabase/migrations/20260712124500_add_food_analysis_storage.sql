-- Create storage bucket for meal photos (public so edge function can access URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "meal-photos_upload_own" ON storage.objects;
CREATE POLICY "meal-photos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: anyone can read (public bucket for AI analysis access)
DROP POLICY IF EXISTS "meal-photos_read_all" ON storage.objects;
CREATE POLICY "meal-photos_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos');

-- Storage policy: authenticated users can delete their own photos
DROP POLICY IF EXISTS "meal-photos_delete_own" ON storage.objects;
CREATE POLICY "meal-photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ensure seed user has onboarding completed and health profile data
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';

  IF existing_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      onboarding_completed = true,
      weight_kg = COALESCE(weight_kg, 75),
      height_cm = COALESCE(height_cm, 175),
      age = COALESCE(age, 30),
      gender = COALESCE(gender, 'male'),
      activity_level = COALESCE(activity_level, 'moderate')
    WHERE id = existing_user_id;
  END IF;
END $$;
