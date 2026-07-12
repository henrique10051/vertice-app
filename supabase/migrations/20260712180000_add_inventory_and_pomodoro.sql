-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  current_quantity NUMERIC DEFAULT 0,
  min_quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  is_on_shopping_list BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pomodoro_logs table
CREATE TABLE IF NOT EXISTS public.pomodoro_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
DROP POLICY IF EXISTS "inventory_items_select_own" ON public.inventory_items;
CREATE POLICY "inventory_items_select_own" ON public.inventory_items
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "inventory_items_insert_own" ON public.inventory_items;
CREATE POLICY "inventory_items_insert_own" ON public.inventory_items
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "inventory_items_update_own" ON public.inventory_items;
CREATE POLICY "inventory_items_update_own" ON public.inventory_items
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "inventory_items_delete_own" ON public.inventory_items;
CREATE POLICY "inventory_items_delete_own" ON public.inventory_items
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for pomodoro_logs
DROP POLICY IF EXISTS "pomodoro_logs_select_own" ON public.pomodoro_logs;
CREATE POLICY "pomodoro_logs_select_own" ON public.pomodoro_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pomodoro_logs_insert_own" ON public.pomodoro_logs;
CREATE POLICY "pomodoro_logs_insert_own" ON public.pomodoro_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pomodoro_logs_update_own" ON public.pomodoro_logs;
CREATE POLICY "pomodoro_logs_update_own" ON public.pomodoro_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pomodoro_logs_delete_own" ON public.pomodoro_logs;
CREATE POLICY "pomodoro_logs_delete_own" ON public.pomodoro_logs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_logs_user_id ON public.pomodoro_logs(user_id);

-- Seed sample inventory items for seed user
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  SELECT id INTO seed_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';
  IF seed_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.inventory_items WHERE user_id = seed_user_id
  ) THEN
    INSERT INTO public.inventory_items (user_id, name, category, current_quantity, min_quantity, unit, is_on_shopping_list)
    VALUES
      (seed_user_id, 'Arroz', 'Alimentação', 2, 1, 'kg', false),
      (seed_user_id, 'Leite', 'Alimentação', 0, 2, 'litro', true),
      (seed_user_id, 'Detergente', 'Limpeza', 1, 2, 'un', false),
      (seed_user_id, 'Papel Higiênico', 'Higiene', 3, 4, 'pacote', false),
      (seed_user_id, 'Café', 'Alimentação', 1, 1, 'pacote', false),
      (seed_user_id, 'Sabão em Pó', 'Limpeza', 0, 1, 'kg', true);
  END IF;
END $$;
