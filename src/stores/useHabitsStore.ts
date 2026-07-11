import { useData, type Habit } from '@/providers/data-provider'

export type { Habit }

export default function useHabitsStore() {
  const { habits, toggleHabit, addHabit, deleteHabit, refetchHabits } = useData()
  return { habits, toggleHabit, addHabit, deleteHabit, refetchHabits }
}
