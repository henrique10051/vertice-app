import { useData, type Habit } from '@/providers/data-provider'

export type { Habit }

export default function useHabitsStore() {
  const {
    habits,
    toggleHabit,
    toggleHabitForDate,
    addHabit,
    updateHabit,
    deleteHabit,
    refetchHabits,
    habitLogsByDate,
    fetchHabitLogsForDate,
    fetchHabitLogsRange,
  } = useData()
  return {
    habits,
    toggleHabit,
    toggleHabitForDate,
    addHabit,
    updateHabit,
    deleteHabit,
    refetchHabits,
    habitLogsByDate,
    fetchHabitLogsForDate,
    fetchHabitLogsRange,
  }
}
