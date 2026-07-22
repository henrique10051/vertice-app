-- Fix RLS gaps found in security audit.

-- 1. meal-photos storage: two unscoped policies (from 20260712194000) were left
--    coexisting with the folder-scoped ones (from 20260712155503). Postgres
--    OR-combines permissive policies, so the unscoped INSERT/UPDATE policies
--    let any authenticated user write into another user's folder. Drop them
--    and replace with a properly folder-scoped UPDATE policy.
DROP POLICY IF EXISTS "meal_photos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "meal_photos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "meal_photos_select_own" ON storage.objects;

DROP POLICY IF EXISTS "meal-photos_update_own" ON storage.objects;
CREATE POLICY "meal-photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'meal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. profiles: no DELETE policy — users could not exercise LGPD "right to
--    erasure" on their own profile row.
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (id = auth.uid());

-- 3. finance_categories: SELECT/INSERT/DELETE existed but no UPDATE, so users
--    could not rename a category without delete+recreate.
DROP POLICY IF EXISTS "finance_categories_update_own" ON public.finance_categories;
CREATE POLICY "finance_categories_update_own" ON public.finance_categories
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
