import { supabase } from '@/lib/supabase/client'

export async function getHabitLogsForRange(userId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('date')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  return { data, error }
}

export async function getPomodoroLogs(userId: string) {
  const { data, error } = await supabase
    .from('pomodoro_logs')
    .select('duration_minutes, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
  return { data, error }
}

export async function getLowStockInventory(userId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  const lowStock = (data || []).filter(
    (item: any) => Number(item.current_quantity ?? 0) <= Number(item.min_quantity ?? 1),
  )
  return { data: lowStock, error }
}
