-- Purchases paid in installments. Registered once; each future month's projection
-- derives its installment charge automatically instead of requiring a monthly re-entry.
CREATE TABLE IF NOT EXISTS public.installment_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  installments_total INTEGER NOT NULL CHECK (installments_total >= 1),
  installment_amount NUMERIC NOT NULL CHECK (installment_amount > 0),
  start_month DATE NOT NULL, -- first month the installment is charged, e.g. 2026-08-01
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.installment_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installment_purchases_select_own" ON public.installment_purchases;
CREATE POLICY "installment_purchases_select_own" ON public.installment_purchases
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "installment_purchases_insert_own" ON public.installment_purchases;
CREATE POLICY "installment_purchases_insert_own" ON public.installment_purchases
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "installment_purchases_delete_own" ON public.installment_purchases;
CREATE POLICY "installment_purchases_delete_own" ON public.installment_purchases
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_installment_purchases_user_start ON public.installment_purchases(user_id, start_month);
