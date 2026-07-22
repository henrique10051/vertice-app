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
  scheduled_time: string | null
  duration_minutes: number
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
  addHabit: (
    title: string,
    frequency: string,
    description?: string,
    scheduledTime?: string | null,
    durationMinutes?: number,
  ) => Promise<{ error: string | null }>
  updateHabit: (
    id: string,
    updates: Partial<Pick<Habit, 'scheduled_time' | 'duration_minutes'>>,
  ) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  financeCategories: string[]
  addFinanceCategory: (name: string) => Promise<void>
  deleteFinanceCategory: (name: string) => Promise<void>
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
  const [financeCategories, setFinanceCategories] = useState<string[]>([])

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

  const fetchFinanceCategories = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('finance_categories')
      .select('name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setFinanceCategories((data || []).map((c) => c.name))
  }, [user])

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchTransactions()
      fetchFinanceCategories()
    } else {
      setHabits([])
      setTransactions([])
      setHabitLogsByDate({})
      setFinanceCategories([])
    }
  }, [user, fetchHabits, fetchTransactions, fetchFinanceCategories])

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
    async (
      title: string,
      frequency: string,
      description?: string,
      scheduledTime?: string | null,
      durationMinutes?: number,
    ) => {
      if (!user) return { error: 'Usuário não autenticado.' }
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title,
          frequency,
          description: description || '',
          is_completed: false,
          scheduled_time: scheduledTime || null,
          duration_minutes: durationMinutes || 30,
        })
        .select()
        .single()
      if (data) setHabits((prev) => [data, ...prev])
      return { error: error?.message ?? null }
    },
    [user],
  )

  const updateHabit = useCallback(
    async (id: string, updates: Partial<Pick<Habit, 'scheduled_time' | 'duration_minutes'>>) => {
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)))
      await supabase.from('habits').update(updates).eq('id', id)
    },
    [],
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

  const addFinanceCategory = useCallback(
    async (name: string) => {
      if (!user || !name.trim()) return
      const { data } = await supabase
        .from('finance_categories')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single()
      if (data) setFinanceCategories((prev) => [...prev, data.name])
    },
    [user],
  )

  const deleteFinanceCategory = useCallback(
    async (name: string) => {
      if (!user) return
      setFinanceCategories((prev) => prev.filter((c) => c !== name))
      await supabase.from('finance_categories').delete().eq('user_id', user.id).eq('name', name)
    },
    [user],
  )

  return (
    <DataContext.Provider
      value={{
        habits,
        transactions,
        habitLogsByDate,
        toggleHabit,
        toggleHabitForDate,
        addHabit,
        updateHabit,
        deleteHabit,
        addTransaction,
        deleteTransaction,
        financeCategories,
        addFinanceCategory,
        deleteFinanceCategory,
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
