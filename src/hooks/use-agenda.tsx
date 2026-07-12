import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getAgendaTasks,
  createAgendaTask,
  updateAgendaTask,
  deleteAgendaTask,
  type AgendaTask,
} from '@/services/agenda'

interface AgendaContextType {
  tasks: AgendaTask[]
  loading: boolean
  addTask: (task: { title: string; description?: string; due_date: string }) => Promise<void>
  updateTask: (id: string, updates: Partial<AgendaTask>) => Promise<void>
  removeTask: (id: string) => Promise<void>
  toggleTask: (id: string, currentStatus: string) => Promise<void>
  refetch: () => Promise<void>
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined)

export const useAgenda = () => {
  const context = useContext(AgendaContext)
  if (!context) throw new Error('useAgenda must be used within AgendaProvider')
  return context
}

export const AgendaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await getAgendaTasks(user.id)
    setTasks(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addTask = useCallback(
    async (task: { title: string; description?: string; due_date: string }) => {
      if (!user) return
      await createAgendaTask(user.id, task)
      await refetch()
    },
    [user, refetch],
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<AgendaTask>) => {
      await updateAgendaTask(id, updates)
      await refetch()
    },
    [refetch],
  )

  const removeTask = useCallback(
    async (id: string) => {
      await deleteAgendaTask(id)
      await refetch()
    },
    [refetch],
  )

  const toggleTask = useCallback(
    async (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending'
      await updateAgendaTask(id, { status: newStatus })
      await refetch()
    },
    [refetch],
  )

  return (
    <AgendaContext.Provider
      value={{ tasks, loading, addTask, updateTask, removeTask, toggleTask, refetch }}
    >
      {children}
    </AgendaContext.Provider>
  )
}
