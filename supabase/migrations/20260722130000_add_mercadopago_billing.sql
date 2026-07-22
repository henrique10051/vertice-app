-- Add Mercado Pago fields to subscriptions and lock down client writes.
-- Plan changes must now go through the mercadopago-checkout / mercadopago-webhook
-- edge functions (service role), which bypass RLS — clients can only read their row.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_status TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id
  ON public.subscriptions(mp_preapproval_id)
  WHERE mp_preapproval_id IS NOT NULL;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policy for authenticated users: all plan changes
-- happen via edge functions using the service role key, which bypasses RLS.
