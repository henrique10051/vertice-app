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

export default function useGoalsStore() {
  const [state, setState] = goalsStore.useStore()

  const toggleSubtask = (goalId: string, subtaskId: string) => {
    setState((prev) => ({
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g
        const updatedSubtasks = g.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s,
        )
        const allCompleted = updatedSubtasks.every((s) => s.completed)
        return {
          ...g,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'Concluído' : 'Em Progresso',
        }
      }),
    }))
  }

  const addGoal = (title: string, targetDate: string, subtasks: string[]) => {
    const newGoal: Goal = {
      id: Math.random().toString(),
      title,
      targetDate,
      status: 'Em Progresso',
      subtasks: subtasks.map((t) => ({ id: Math.random().toString(), title: t, completed: false })),
    }
    setState((prev) => ({ goals: [...prev.goals, newGoal] }))
  }

  return { goals: state.goals, toggleSubtask, addGoal }
}
