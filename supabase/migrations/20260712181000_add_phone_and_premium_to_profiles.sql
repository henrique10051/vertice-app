-- Add phone_number and is_premium columns to profiles
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add unique index on phone_number (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_number_unique
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL;

-- Ensure RLS policies allow users to read/update their own profile (including new columns)
-- profiles RLS already exists, but we re-create to be safe
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Mark seed user as premium for testing
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET is_premium = true
    WHERE id = existing_user_id;
  END IF;
END $$;
