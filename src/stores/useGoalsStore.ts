import { createStore } from './main'

export type Subtask = { id: string; title: string; completed: boolean }
export type Goal = {
  id: string
  title: string
  targetDate: string
  status: 'Em Progresso' | 'Concluído' | 'Planejado'
  subtasks: Subtask[]
}

const initialGoals: Goal[] = [
  {
    id: '1',
    title: 'Fundo de Emergência',
    targetDate: '2026-12-31',
    status: 'Em Progresso',
    subtasks: [
      { id: 's1', title: 'Abrir conta de investimentos', completed: true },
      { id: 's2', title: 'Guardar primeiros R$ 1.000', completed: false },
      { id: 's3', title: 'Atingir R$ 10.000', completed: false },
    ],
  },
  {
    id: '2',
    title: 'Aprender React Avançado',
    targetDate: '2026-08-30',
    status: 'Em Progresso',
    subtasks: [
      { id: 's4', title: 'Completar curso de Hooks', completed: true },
      { id: 's5', title: 'Criar projeto final', completed: false },
    ],
  },
]

const goalsStore = createStore<{ goals: Goal[] }>({ goals: initialGoals })

function statusForSubtasks(subtasks: Subtask[]): Goal['status'] {
  if (subtasks.length > 0 && subtasks.every((s) => s.completed)) return 'Concluído'
  return 'Em Progresso'
}

export default function useGoalsStore() {
  const [state, setState] = goalsStore.useStore()

  const toggleSubtask = (goalId: string, subtaskId: string) => {
    setState((prev) => ({
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g
        const updatedSubtasks = g.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s,
        )
        return { ...g, subtasks: updatedSubtasks, status: statusForSubtasks(updatedSubtasks) }
      }),
    }))
  }

  const addGoal = (title: string, targetDate: string, subtasks: string[]) => {
    const newGoal: Goal = {
      id: Math.random().toString(),
      title,
      targetDate,
      status: 'Em Progresso',
      subtasks: subtasks
        .filter((t) => t.trim())
        .map((t) => ({ id: Math.random().toString(), title: t.trim(), completed: false })),
    }
    setState((prev) => ({ goals: [...prev.goals, newGoal] }))
  }

  /**
   * Edits title/date/subtasks. Each entry may carry an existing `id` (preserves its completed
   * state) or omit it (created fresh, not completed). Entries whose id no longer appears in the
   * new list are dropped, so removing a row in the edit form deletes that subtask.
   */
  const updateGoal = (
    goalId: string,
    updates: { title: string; targetDate: string; subtasks: { id?: string; title: string }[] },
  ) => {
    setState((prev) => ({
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g
        const subtasks: Subtask[] = updates.subtasks
          .filter((s) => s.title.trim())
          .map((s) => {
            const existing = s.id ? g.subtasks.find((old) => old.id === s.id) : undefined
            return {
              id: existing?.id || Math.random().toString(),
              title: s.title.trim(),
              completed: existing?.completed || false,
            }
          })
        return {
          ...g,
          title: updates.title,
          targetDate: updates.targetDate,
          subtasks,
          status: statusForSubtasks(subtasks),
        }
      }),
    }))
  }

  const deleteGoal = (goalId: string) => {
    setState((prev) => ({ goals: prev.goals.filter((g) => g.id !== goalId) }))
  }

  return { goals: state.goals, toggleSubtask, addGoal, updateGoal, deleteGoal }
}
