import { supabase } from '@/lib/supabase/client'

export type PomodoroLog = {
  id: string
  user_id: string
  habit_id: string | null
  duration_minutes: number
  completed_at: string | null
}

export async function createPomodoroLog(userId: string, durationMinutes: number, habitId?: string) {
  const { data, error } = await supabase
    .from('pomodoro_logs')
    .insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
      habit_id: habitId || null,
    })
    .select()
    .single()
  return { data: data as PomodoroLog | null, error }
}

export async function getPomodoroLogs(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('pomodoro_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit)
  return { data: data as PomodoroLog[] | null, error }
}
