-- Reading plan: user's saved books (from search or curated suggestions)
CREATE TABLE IF NOT EXISTS public.reading_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  google_books_id TEXT,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'quero_ler' CHECK (status IN ('quero_ler', 'lendo', 'lido')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_list_select_own" ON public.reading_list;
CREATE POLICY "reading_list_select_own" ON public.reading_list
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reading_list_insert_own" ON public.reading_list;
CREATE POLICY "reading_list_insert_own" ON public.reading_list
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reading_list_update_own" ON public.reading_list;
CREATE POLICY "reading_list_update_own" ON public.reading_list
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reading_list_delete_own" ON public.reading_list;
CREATE POLICY "reading_list_delete_own" ON public.reading_list
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reading_list_user_id ON public.reading_list(user_id);

-- News cache: shared across all users, refreshed periodically by the news-feed
-- edge function so we don't re-fetch every RSS source on every page load.
CREATE TABLE IF NOT EXISTS public.news_cache (
  category TEXT PRIMARY KEY,
  articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Shared read-only cache: any authenticated user can read; only the edge
-- function (service role, which bypasses RLS) writes to it.
DROP POLICY IF EXISTS "news_cache_select_all" ON public.news_cache;
CREATE POLICY "news_cache_select_all" ON public.news_cache
  FOR SELECT TO authenticated USING (true);
