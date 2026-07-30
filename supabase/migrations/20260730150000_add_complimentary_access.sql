-- Distinguishes subscriptions granted for free (closed beta, manual comps) from
-- real AbacatePay payments, without touching the billing columns' meaning.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS access_source TEXT NOT NULL DEFAULT 'abacatepay';
