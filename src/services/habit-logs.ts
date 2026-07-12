import { supabase } from '@/lib/supabase/client'
import { getTodayStr } from '@/lib/date-utils'

export type HabitLog = {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed_at: string
}

export async function getHabitLogs(userId: string, date?: string) {
  const targetDate = date || getTodayStr()
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', targetDate)
  return { data: data as HabitLog[] | null, error }
}

export async function getHabitLogsRange(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  return { data: data as HabitLog[] | null, error }
}

export async function toggleHabitLog(userId: string, habitId: string, date?: string) {
  const targetDate = date || getTodayStr()

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('date', targetDate)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id)
    return { deleted: true, error }
  }

  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      user_id: userId,
      habit_id: habitId,
      date: targetDate,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  return { data: data as HabitLog | null, deleted: false, error }
}
