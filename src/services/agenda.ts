import { supabase } from '@/lib/supabase/client'

export interface AgendaTask {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string
  status: 'pending' | 'completed'
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
  task: { title: string; description?: string; due_date: string },
) {
  const { data, error } = await supabase
    .from('agenda_tasks')
    .insert({
      user_id: userId,
      title: task.title,
      description: task.description || null,
      due_date: task.due_date,
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
