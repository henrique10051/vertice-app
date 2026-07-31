-- Migration to create the feedbacks table and policies
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Select policy: users can only see their own feedback
DROP POLICY IF EXISTS "feedbacks_select_own" ON public.feedbacks;
CREATE POLICY "feedbacks_select_own" ON public.feedbacks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Insert policy: users can only submit feedback for their own account
DROP POLICY IF EXISTS "feedbacks_insert_own" ON public.feedbacks;
CREATE POLICY "feedbacks_insert_own" ON public.feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
