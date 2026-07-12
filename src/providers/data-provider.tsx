import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { getTodayStr } from '@/lib/date-utils'

export type Habit = {
  id: string
  user_id: string
  title: string
  description: string
  frequency: string
  is_completed: boolean
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  created_at: string
}

interface DataContextType {
  habits: Habit[]
  transactions: Transaction[]
  habitLogsByDate: Record<string, string[]>
  toggleHabit: (id: string) => Promise<void>
  toggleHabitForDate: (id: string, date: string) => Promise<void>
  addHabit: (title: string, frequency: string, description?: string) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  refetchHabits: () => Promise<void>
  refetchTransactions: () => Promise<void>
  fetchHabitLogsForDate: (date: string) => Promise<void>
  fetchHabitLogsRange: (startDate: string, endDate: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [habitLogsByDate, setHabitLogsByDate] = useState<Record<string, string[]>>({})

  const fetchHabits = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setHabits(data || [])
  }, [user])

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setTransactions(data || [])
  }, [user])

  const fetchHabitLogsForDate = useCallback(
    async (date: string) => {
      if (!user) return
      const { data } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('date', date)
      const ids = (data || []).map((d) => d.habit_id)
      setHabitLogsByDate((prev) => ({ ...prev, [date]: ids }))
    },
    [user],
  )

  const fetchHabitLogsRange = useCallback(
    async (startDate: string, endDate: string) => {
      if (!user) return
      const { data } = await supabase
        .from('habit_logs')
        .select('habit_id, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
      const byDate: Record<string, string[]> = {}
      ;(data || []).forEach((d) => {
        if (!byDate[d.date]) byDate[d.date] = []
        byDate[d.date].push(d.habit_id)
      })
      setHabitLogsByDate((prev) => ({ ...prev, ...byDate }))
    },
    [user],
  )

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchTransactions()
    } else {
      setHabits([])
      setTransactions([])
      setHabitLogsByDate({})
    }
  }, [user, fetchHabits, fetchTransactions])

  const toggleHabitForDate = useCallback(
    async (id: string, date: string) => {
      if (!user) return
      const isToday = date === getTodayStr()

      setHabitLogsByDate((prev) => {
        const current = prev[date] || []
        const isCompleted = current.includes(id)
        const newLogs = isCompleted ? current.filter((hId) => hId !== id) : [...current, id]
        return { ...prev, [date]: newLogs }
      })

      if (isToday) {
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, is_completed: !h.is_completed } : h)),
        )
      }

      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('habit_id', id)
        .eq('date', date)
        .maybeSingle()

      if (existing) {
        await supabase.from('habit_logs').delete().eq('id', existing.id)
        if (isToday) await supabase.from('habits').update({ is_completed: false }).eq('id', id)
      } else {
        await supabase.from('habit_logs').insert({
          user_id: user.id,
          habit_id: id,
          date,
          completed_at: new Date().toISOString(),
        })
        if (isToday) await supabase.from('habits').update({ is_completed: true }).eq('id', id)
      }
    },
    [user],
  )

  const toggleHabit = useCallback(
    async (id: string) => {
      await toggleHabitForDate(id, getTodayStr())
    },
    [toggleHabitForDate],
  )

  const addHabit = useCallback(
    async (title: string, frequency: string, description?: string) => {
      if (!user) return
      const { data } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title,
          frequency,
          description: description || '',
          is_completed: false,
        })
        .select()
        .single()
      if (data) setHabits((prev) => [data, ...prev])
    },
    [user],
  )

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setHabitLogsByDate((prev) => {
      const updated: Record<string, string[]> = {}
      Object.entries(prev).forEach(([date, ids]) => {
        updated[date] = ids.filter((hId) => hId !== id)
      })
      return updated
    })
    await supabase.from('habit_logs').delete().eq('habit_id', id)
    await supabase.from('habits').delete().eq('id', id)
  }, [])

  const addTransaction = useCallback(
    async (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return
      const { data } = await supabase
        .from('transactions')
        .insert({ ...t, user_id: user.id })
        .select()
        .single()
      if (data) setTransactions((prev) => [data, ...prev])
    },
    [user],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('transactions').delete().eq('id', id)
  }, [])

  return (
    <DataContext.Provider
      value={{
        habits,
        transactions,
        habitLogsByDate,
        toggleHabit,
        toggleHabitForDate,
        addHabit,
        deleteHabit,
        addTransaction,
        deleteTransaction,
        refetchHabits: fetchHabits,
        refetchTransactions: fetchTransactions,
        fetchHabitLogsForDate,
        fetchHabitLogsRange,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
