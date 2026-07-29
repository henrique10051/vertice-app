import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  getCustomTrackers,
  createCustomTracker,
  deleteCustomTracker,
  getTrackerLogs,
  createTrackerLog,
  deleteTrackerLog,
  type CustomTracker,
  type TrackerField,
  type TrackerLog,
} from '@/services/custom-trackers'

interface CustomTrackersContextType {
  trackers: CustomTracker[]
  logs: TrackerLog[]
  loading: boolean
  addTracker: (tracker: {
    name: string
    fields_schema: TrackerField[]
    category?: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | null
    habit_id?: string | null
  }) => Promise<{ error: string | null; data: CustomTracker | null }>
  removeTracker: (id: string) => Promise<void>
  addLog: (log: {
    tracker_id: string
    task_id?: string | null
    content: Record<string, any>
  }) => Promise<{ error: string | null; data: TrackerLog | null }>
  removeLog: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const CustomTrackersContext = createContext<CustomTrackersContextType | undefined>(undefined)

export const useCustomTrackers = () => {
  const context = useContext(CustomTrackersContext)
  if (!context) throw new Error('useCustomTrackers must be used within CustomTrackersProvider')
  return context
}

export const CustomTrackersProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [trackers, setTrackers] = useState<CustomTracker[]>([])
  const [logs, setLogs] = useState<TrackerLog[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setTrackers([])
      setLogs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [trackersRes, logsRes] = await Promise.all([
        getCustomTrackers(user.id),
        getTrackerLogs(user.id),
      ])
      setTrackers(trackersRes.data || [])
      setLogs(logsRes.data || [])
    } catch {
      // Quiet fail to match codebase pattern
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addTracker = useCallback(
    async (tracker: {
      name: string
      fields_schema: TrackerField[]
      category?: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'outro' | null
      habit_id?: string | null
    }) => {
      if (!user) return { error: 'Usuário não autenticado.', data: null }
      const { data, error } = await createCustomTracker(user.id, tracker)
      if (data) {
        setTrackers((prev) => [data, ...prev])
      }
      return { error: error?.message ?? null, data }
    },
    [user],
  )

  const removeTracker = useCallback(async (id: string) => {
    await deleteCustomTracker(id)
    setTrackers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addLog = useCallback(
    async (log: { tracker_id: string; task_id?: string | null; content: Record<string, any> }) => {
      if (!user) return { error: 'Usuário não autenticado.', data: null }
      const { data, error } = await createTrackerLog(user.id, log)
      if (data) {
        setLogs((prev) => [data, ...prev])
      }
      return { error: error?.message ?? null, data }
    },
    [user],
  )

  const removeLog = useCallback(async (id: string) => {
    await deleteTrackerLog(id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return (
    <CustomTrackersContext.Provider
      value={{
        trackers,
        logs,
        loading,
        addTracker,
        removeTracker,
        addLog,
        removeLog,
        refetch,
      }}
    >
      {children}
    </CustomTrackersContext.Provider>
  )
}
