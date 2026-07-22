import { supabase } from '@/lib/supabase/client'

export type AgendaCategory = 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro'

export interface AgendaTask {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string
  duration_minutes: number
  status: 'pending' | 'completed'
  category: AgendaCategory
  created_at: string
}

export async function getAgendaTasks(userId: string) {
  const { data, error } = await supabase
    .from('agenda_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
  return { data: (data as AgendaTask[]) ?? [], error }
}

export async function createAgendaTask(
  userId: string,
  task: {
    title: string
    description?: string
    due_date: string
    category?: AgendaCategory
    duration_minutes?: number
  },
) {
  const { data, error } = await supabase
    .from('agenda_tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description || null,
      due_date: task.due_date,
      category: task.category || 'pessoal',
      duration_minutes: task.duration_minutes || 60,
      status: 'pending',
    })
    .select()
    .single()
  return { data: data as AgendaTask | null, error }
}

export async function updateAgendaTask(id: string, updates: Partial<AgendaTask>) {
  const { data, error } = await supabase
    .from('agenda_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as AgendaTask | null, error }
}

export async function deleteAgendaTask(id: string) {
  const { data, error } = await supabase.from('agenda_tasks').delete().eq('id', id)
  return { data, error }
}
