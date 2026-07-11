import { createStore } from './main'
import { getTodayStr } from '@/lib/date-utils'

export type Habit = {
  id: string
  name: string
  icon: string
  streak: number
  history: string[] // Array of YYYY-MM-DD
}

const initialHabits: Habit[] = [
  { id: '1', name: 'Beber 2L de Água', icon: 'droplets', streak: 12, history: [getTodayStr()] },
  { id: '2', name: 'Ler 10 páginas', icon: 'book', streak: 5, history: [] },
  { id: '3', name: 'Exercício (30m)', icon: 'dumbbell', streak: 2, history: [] },
]

const habitsStore = createStore<{ habits: Habit[] }>({ habits: initialHabits })

export default function useHabitsStore() {
  const [state, setState] = habitsStore.useStore()

  const toggleHabit = (id: string, dateStr: string) => {
    setState((prev) => ({
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const isCompleted = h.history.includes(dateStr)
        const newHistory = isCompleted
          ? h.history.filter((d) => d !== dateStr)
          : [...h.history, dateStr]
        return {
          ...h,
          history: newHistory,
          streak: isCompleted ? Math.max(0, h.streak - 1) : h.streak + 1,
        }
      }),
    }))
  }

  const addHabit = (name: string, icon: string) => {
    setState((prev) => ({
      habits: [
        ...prev.habits,
        { id: Math.random().toString(), name, icon, streak: 0, history: [] },
      ],
    }))
  }

  return { habits: state.habits, toggleHabit, addHabit }
}
