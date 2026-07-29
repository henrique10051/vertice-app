import { supabase } from '@/lib/supabase/client'

export type TrackerFieldType = 'number' | 'text' | 'boolean'

export interface TrackerField {
  name: string
  label: string
  type: TrackerFieldType
  required?: boolean
}

export interface CustomTracker {
  id: string
  user_id: string
  name: string
  fields_schema: TrackerField[]
  category?: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | null
  habit_id?: string | null
  created_at: string
}

export interface TrackerLog {
  id: string
  user_id: string
  tracker_id: string
  task_id?: string | null
  content: Record<string, any>
  created_at: string
}

export async function getCustomTrackers(userId: string) {
  const { data, error } = await supabase
    .from('custom_trackers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: (data as CustomTracker[]) ?? [], error }
}

export async function createCustomTracker(
  userId: string,
  tracker: {
    name: string
    fields_schema: TrackerField[]
    category?: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | null
    habit_id?: string | null
  },
) {
  const { data, error } = await supabase
    .from('custom_trackers')
    .insert({
      user_id: userId,
      name: tracker.name,
      fields_schema: tracker.fields_schema,
      category: tracker.category || null,
      habit_id: tracker.habit_id || null,
    })
    .select()
    .single()
  return { data: data as CustomTracker | null, error }
}

export async function deleteCustomTracker(id: string) {
  const { data, error } = await supabase.from('custom_trackers').delete().eq('id', id)
  return { data, error }
}

export async function getTrackerLogs(userId: string) {
  const { data, error } = await supabase
    .from('tracker_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: (data as TrackerLog[]) ?? [], error }
}

export async function createTrackerLog(
  userId: string,
  log: {
    tracker_id: string
    task_id?: string | null
    content: Record<string, any>
  },
) {
  const { data, error } = await supabase
    .from('tracker_logs')
    .insert({
      user_id: userId,
      tracker_id: log.tracker_id,
      task_id: log.task_id || null,
      content: log.content,
    })
    .select()
    .single()
  return { data: data as TrackerLog | null, error }
}

export async function deleteTrackerLog(id: string) {
  const { data, error } = await supabase.from('tracker_logs').delete().eq('id', id)
  return { data, error }
}
