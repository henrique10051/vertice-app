-- Database migration for Advanced Schema-Driven Custom Trackers matching RoutineFlow architecture
CREATE TABLE IF NOT EXISTS public.custom_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT CHECK (category_id IN ('pessoal', 'trabalho', 'saude', 'financas', 'outro')),
  validation JSONB NOT NULL, -- Ex: [{"name": "distancia", "type": "number", "required": true}]
  view_type TEXT DEFAULT 'card' CHECK (view_type IN ('card', 'list', 'table')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.custom_tracker_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES public.custom_trackers(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.agenda_tasks(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  values JSONB NOT NULL, -- Ex: {"distancia": 12.5, "series": [{"sets": 1, "reps": 10}]}
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.custom_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tracker_entries ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies for custom_trackers
DROP POLICY IF EXISTS "trackers_select_all" ON public.custom_trackers;
CREATE POLICY "trackers_select_all" ON public.custom_trackers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_insert_all" ON public.custom_trackers;
CREATE POLICY "trackers_insert_all" ON public.custom_trackers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_update_all" ON public.custom_trackers;
CREATE POLICY "trackers_update_all" ON public.custom_trackers
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_delete_all" ON public.custom_trackers;
CREATE POLICY "trackers_delete_all" ON public.custom_trackers
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Setup RLS Policies for custom_tracker_entries
DROP POLICY IF EXISTS "entries_select_all" ON public.custom_tracker_entries;
CREATE POLICY "entries_select_all" ON public.custom_tracker_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "entries_insert_all" ON public.custom_tracker_entries;
CREATE POLICY "entries_insert_all" ON public.custom_tracker_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "entries_update_all" ON public.custom_tracker_entries;
CREATE POLICY "entries_update_all" ON public.custom_tracker_entries
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "entries_delete_all" ON public.custom_tracker_entries;
CREATE POLICY "entries_delete_all" ON public.custom_tracker_entries
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Setup database indexes
CREATE INDEX IF NOT EXISTS idx_ct_trackers_user_id ON public.custom_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_ct_entries_user_id ON public.custom_tracker_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ct_entries_tracker_id ON public.custom_tracker_entries(tracker_id);
CREATE INDEX IF NOT EXISTS idx_ct_entries_task_id ON public.custom_tracker_entries(task_id);
