import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { getTodayStr } from '@/lib/date-utils'
import type { TrackerField } from '@/services/custom-trackers-schema'

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
  validation?: TrackerField[]
  view_type?: 'card' | 'list' | 'table'
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

export type Budget = {
  id: string
  user_id: string
  month: string // "YYYY-MM-01"
  type: 'income' | 'expense'
  category: string
  amount: number
  created_at: string
}

export type InstallmentPurchase = {
  id: string
  user_id: string
  description: string
  category: string
  total_amount: number
  installments_total: number
  installment_amount: number
  start_month: string // "YYYY-MM-01"
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
    validation?: TrackerField[],
    viewType?: 'card' | 'list' | 'table',
  ) => Promise<{ error: string | null }>
  updateHabit: (
    id: string,
    updates: Partial<Pick<Habit, 'scheduled_time' | 'duration_minutes'>>,
  ) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateTransaction: (
    id: string,
    updates: Omit<Transaction, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  financeCategories: string[]
  addFinanceCategory: (name: string) => Promise<void>
  deleteFinanceCategory: (name: string) => Promise<void>
  budgets: Budget[]
  upsertBudget: (b: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  installmentPurchases: InstallmentPurchase[]
  addInstallmentPurchase: (
    p: Omit<InstallmentPurchase, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<void>
  deleteInstallmentPurchase: (id: string) => Promise<void>
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
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>([])

  const fetchHabits = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('custom_trackers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_habit', true)
      .order('created_at', { ascending: false })
    const mappedHabits: Habit[] = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      title: t.name,
      description: t.description || '',
      frequency: t.frequency || 'daily',
      is_completed: false,
      scheduled_time: t.scheduled_time,
      duration_minutes: t.duration_minutes || 0,
      created_at: t.created_at,
      validation: t.validation || [],
      view_type: t.view_type || 'card',
    }))
    setHabits(mappedHabits)
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
        .from('custom_tracker_entries')
        .select('tracker_id')
        .eq('user_id', user.id)
        .eq('date', date)
      const ids = (data || []).map((d: any) => d.tracker_id)
      setHabitLogsByDate((prev) => ({ ...prev, [date]: ids }))
    },
    [user],
  )

  const fetchHabitLogsRange = useCallback(
    async (startDate: string, endDate: string) => {
      if (!user) return
      const { data } = await supabase
        .from('custom_tracker_entries')
        .select('tracker_id, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
      const byDate: Record<string, string[]> = {}
      ;(data || []).forEach((d: any) => {
        if (!byDate[d.date]) byDate[d.date] = []
        byDate[d.date].push(d.tracker_id)
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

  const fetchBudgets = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true })
    setBudgets(data || [])
  }, [user])

  const fetchInstallmentPurchases = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('installment_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('start_month', { ascending: false })
    setInstallmentPurchases(data || [])
  }, [user])

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchTransactions()
      fetchFinanceCategories()
      fetchBudgets()
      fetchInstallmentPurchases()
    } else {
      setHabits([])
      setTransactions([])
      setHabitLogsByDate({})
      setFinanceCategories([])
      setBudgets([])
      setInstallmentPurchases([])
    }
  }, [
    user,
    fetchHabits,
    fetchTransactions,
    fetchFinanceCategories,
    fetchBudgets,
    fetchInstallmentPurchases,
  ])

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
        .from('custom_tracker_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('tracker_id', id)
        .eq('date', date)
        .maybeSingle()

      if (existing) {
        await supabase.from('custom_tracker_entries').delete().eq('id', existing.id)
      } else {
        await supabase.from('custom_tracker_entries').insert({
          user_id: user.id,
          tracker_id: id,
          date,
          values: { is_completed: true },
        })
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
      validation: TrackerField[] = [],
      viewType: 'card' | 'list' | 'table' = 'card',
    ) => {
      if (!user) return { error: 'Usuário não autenticado.' }
      const { data, error } = await supabase
        .from('custom_trackers')
        .insert({
          user_id: user.id,
          name: title,
          is_habit: true,
          frequency,
          description: description || '',
          scheduled_time: scheduledTime || null,
          duration_minutes: durationMinutes || 30,
          validation: validation,
          view_type: viewType,
        })
        .select()
        .single()
      if (data) {
        const mapped: Habit = {
          id: data.id,
          user_id: data.user_id,
          title: data.name,
          description: data.description || '',
          frequency: data.frequency || 'daily',
          is_completed: false,
          scheduled_time: data.scheduled_time,
          duration_minutes: data.duration_minutes || 0,
          created_at: data.created_at,
          validation: data.validation || [],
          view_type: data.view_type || 'card',
        }
        setHabits((prev) => [mapped, ...prev])
      }
      return { error: error?.message ?? null }
    },
    [user],
  )

  const updateHabit = useCallback(
    async (id: string, updates: Partial<Pick<Habit, 'scheduled_time' | 'duration_minutes'>>) => {
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)))
      await supabase.from('custom_trackers').update(updates).eq('id', id)
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
    await supabase.from('custom_tracker_entries').delete().eq('tracker_id', id)
    await supabase.from('custom_trackers').delete().eq('id', id)
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

  const updateTransaction = useCallback(
    async (id: string, updates: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
      await supabase.from('transactions').update(updates).eq('id', id)
    },
    [],
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

  const upsertBudget = useCallback(
    async (b: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return
      const { data } = await supabase
        .from('budgets')
        .upsert({ ...b, user_id: user.id }, { onConflict: 'user_id,month,type,category' })
        .select()
        .single()
      if (data) {
        setBudgets((prev) => {
          const existing = prev.filter((x) => x.id !== data.id)
          return [...existing, data]
        })
      }
    },
    [user],
  )

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('budgets').delete().eq('id', id)
  }, [])

  const addInstallmentPurchase = useCallback(
    async (p: Omit<InstallmentPurchase, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return
      const { data } = await supabase
        .from('installment_purchases')
        .insert({ ...p, user_id: user.id })
        .select()
        .single()
      if (data) setInstallmentPurchases((prev) => [data, ...prev])
    },
    [user],
  )

  const deleteInstallmentPurchase = useCallback(async (id: string) => {
    setInstallmentPurchases((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('installment_purchases').delete().eq('id', id)
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
        updateHabit,
        deleteHabit,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        financeCategories,
        addFinanceCategory,
        deleteFinanceCategory,
        budgets,
        upsertBudget,
        deleteBudget,
        installmentPurchases,
        addInstallmentPurchase,
        deleteInstallmentPurchase,
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
