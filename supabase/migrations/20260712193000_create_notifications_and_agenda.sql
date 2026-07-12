-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agenda_tasks table
CREATE TABLE IF NOT EXISTS public.agenda_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for agenda_tasks
DROP POLICY IF EXISTS "agenda_tasks_select_own" ON public.agenda_tasks;
CREATE POLICY "agenda_tasks_select_own" ON public.agenda_tasks
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "agenda_tasks_insert_own" ON public.agenda_tasks;
CREATE POLICY "agenda_tasks_insert_own" ON public.agenda_tasks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "agenda_tasks_update_own" ON public.agenda_tasks;
CREATE POLICY "agenda_tasks_update_own" ON public.agenda_tasks
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "agenda_tasks_delete_own" ON public.agenda_tasks;
CREATE POLICY "agenda_tasks_delete_own" ON public.agenda_tasks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_tasks_user_id ON public.agenda_tasks(user_id);

-- Seed sample data for demo user
DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  SELECT id INTO seed_user_id FROM auth.users WHERE email = 'hlima10051@gmail.com';
  IF seed_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read)
    SELECT seed_user_id, t.title, t.message, t.type, t.is_read
    FROM (VALUES
      ('Item em falta no estoque', 'Leite está abaixo da quantidade mínima. Adicione à lista de compras.', 'inventory', false),
      ('Tarefa agendada para hoje', 'Você tem "Exercícios matinais" agendada para hoje.', 'agenda', false),
      ('Bem-vindo ao Vértice!', 'Explore todas as funcionalidades do seu sistema de crescimento pessoal.', 'system', true)
    ) AS t(title, message, type, is_read)
    WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = seed_user_id);

    INSERT INTO public.agenda_tasks (user_id, title, description, due_date, status)
    SELECT seed_user_id, t.title, t.description, t.due_date, t.status
    FROM (VALUES
      ('Exercícios matinais', '30 minutos de caminhada', NOW()::date::timestamptz, 'pending'),
      ('Revisar finanças', 'Conferir gastos da semana', (NOW() + INTERVAL '2 days')::timestamptz, 'pending'),
      ('Compras do mês', 'Lista de compras do supermercado', (NOW() + INTERVAL '5 days')::timestamptz, 'pending'),
      ('Organizar arquivo', 'Separar documentos importantes', (NOW() + INTERVAL '10 days')::timestamptz, 'pending')
    ) AS t(title, description, due_date, status)
    WHERE NOT EXISTS (SELECT 1 FROM public.agenda_tasks WHERE user_id = seed_user_id);
  END IF;
END $$;
