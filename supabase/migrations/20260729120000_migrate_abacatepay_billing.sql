-- Migrate billing from Mercado Pago (never went to production) to AbacatePay.
-- Plan changes still go exclusively through edge functions (service role),
-- clients can only read their row.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS abacatepay_bill_id TEXT,
  ADD COLUMN IF NOT EXISTS abacatepay_status TEXT;

DROP INDEX IF EXISTS idx_subscriptions_mp_preapproval_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_abacatepay_bill_id
  ON public.subscriptions(abacatepay_bill_id)
  WHERE abacatepay_bill_id IS NOT NULL;

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS mp_preapproval_id,
  DROP COLUMN IF EXISTS mp_status;
