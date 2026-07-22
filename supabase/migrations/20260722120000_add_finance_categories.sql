-- Create finance_categories table so users can manage their own transaction categories
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_categories_select_own" ON public.finance_categories;
CREATE POLICY "finance_categories_select_own" ON public.finance_categories
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "finance_categories_insert_own" ON public.finance_categories;
CREATE POLICY "finance_categories_insert_own" ON public.finance_categories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "finance_categories_delete_own" ON public.finance_categories;
CREATE POLICY "finance_categories_delete_own" ON public.finance_categories
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_finance_categories_user_id ON public.finance_categories(user_id);

-- Seed default categories for every existing user that doesn't have any yet
DO $$
DECLARE
  u RECORD;
  default_names TEXT[] := ARRAY['Moradia', 'Alimentação', 'Transporte', 'Educação/Crescimento', 'Renda'];
  cat_name TEXT;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.finance_categories WHERE user_id = u.id) THEN
      FOREACH cat_name IN ARRAY default_names LOOP
        INSERT INTO public.finance_categories (user_id, name)
        VALUES (u.id, cat_name)
        ON CONFLICT (user_id, name) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
