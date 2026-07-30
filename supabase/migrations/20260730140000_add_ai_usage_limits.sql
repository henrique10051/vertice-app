-- AI usage quota per user per calendar month, gating Mentor IA calls by plan.
-- Limits (messages/month): free 40 · pro 150 · premium 500 (see consume_ai_usage callers).
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, period_month)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_select_own" ON public.ai_usage;
CREATE POLICY "ai_usage_select_own" ON public.ai_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- No insert/update policy for clients: quota is only ever consumed through
-- consume_ai_usage() below (SECURITY DEFINER), never written directly.

-- Atomically checks the caller's usage against p_limit and, if under it,
-- increments the counter in the same transaction (row-locked to avoid races
-- from rapid double-submits). Must be called with the user's own JWT (RLS
-- context), not a service-role key, since it relies on auth.uid().
CREATE OR REPLACE FUNCTION public.consume_ai_usage(p_limit INTEGER)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, "limit" INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_month DATE := date_trunc('month', now())::date;
  v_used INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.ai_usage (user_id, period_month, message_count)
  VALUES (v_user_id, v_month, 0)
  ON CONFLICT (user_id, period_month) DO NOTHING;

  SELECT message_count INTO v_used
  FROM public.ai_usage
  WHERE user_id = v_user_id AND period_month = v_month
  FOR UPDATE;

  IF v_used >= p_limit THEN
    RETURN QUERY SELECT false, v_used, p_limit;
    RETURN;
  END IF;

  UPDATE public.ai_usage
  SET message_count = message_count + 1, updated_at = now()
  WHERE user_id = v_user_id AND period_month = v_month;

  RETURN QUERY SELECT true, v_used + 1, p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_ai_usage(INTEGER) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON public.ai_usage(user_id, period_month);
