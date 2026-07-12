import { supabase } from '@/lib/supabase/client'

export type PomodoroLog = {
  id: string
  user_id: string
  habit_id: string | null
  duration_minutes: number
  completed_at: string
}

export async function getPomodoroLogs(userId: string) {
  const { data, error } = await supabase
    .from('pomodoro_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(50)
  return { data: data as PomodoroLog[] | null, error }
}

export async function createPomodoroLog(
  userId: string,
  habitId: string | null,
  durationMinutes: number,
) {
  const { data, error } = await supabase
    .from('pomodoro_logs')
    .insert({ user_id: userId, habit_id: habitId, duration_minutes: durationMinutes })
    .select()
    .single()
  return { data: data as PomodoroLog | null, error }
}
