-- Create custom trackers table to allow users to build custom quantitative tracking schemas
CREATE TABLE IF NOT EXISTS public.custom_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  fields_schema JSONB NOT NULL, -- Ex: [{"name": "distancia", "label": "Distância (km)", "type": "number"}]
  category TEXT CHECK (category IN ('pessoal', 'trabalho', 'saude', 'financas', 'outro')),
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create tracker logs table to store actual user-submitted content
CREATE TABLE IF NOT EXISTS public.tracker_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES public.custom_trackers(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.agenda_tasks(id) ON DELETE CASCADE,
  content JSONB NOT NULL, -- Ex: {"distancia": 8.5}
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Associate tasks with custom trackers
ALTER TABLE public.agenda_tasks 
  ADD COLUMN IF NOT EXISTS tracker_id UUID REFERENCES public.custom_trackers(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.custom_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_logs ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
DROP POLICY IF EXISTS "trackers_select_own" ON public.custom_trackers;
CREATE POLICY "trackers_select_own" ON public.custom_trackers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_insert_own" ON public.custom_trackers;
CREATE POLICY "trackers_insert_own" ON public.custom_trackers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_update_own" ON public.custom_trackers;
CREATE POLICY "trackers_update_own" ON public.custom_trackers
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trackers_delete_own" ON public.custom_trackers;
CREATE POLICY "trackers_delete_own" ON public.custom_trackers
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "logs_select_own" ON public.tracker_logs;
CREATE POLICY "logs_select_own" ON public.tracker_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "logs_insert_own" ON public.tracker_logs;
CREATE POLICY "logs_insert_own" ON public.tracker_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "logs_update_own" ON public.tracker_logs;
CREATE POLICY "logs_update_own" ON public.tracker_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "logs_delete_own" ON public.tracker_logs;
CREATE POLICY "logs_delete_own" ON public.tracker_logs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Add indices for query optimization
CREATE INDEX IF NOT EXISTS idx_custom_trackers_user_id ON public.custom_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_user_id ON public.tracker_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_task_id ON public.tracker_logs(task_id);
