import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

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
  toggleHabit: (id: string) => Promise<void>
  addHabit: (title: string, frequency: string, description?: string) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  refetchHabits: () => Promise<void>
  refetchTransactions: () => Promise<void>
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

  useEffect(() => {
    if (user) {
      fetchHabits()
      fetchTransactions()
    } else {
      setHabits([])
      setTransactions([])
    }
  }, [user, fetchHabits, fetchTransactions])

  const toggleHabit = useCallback(async (id: string) => {
    setHabits((prev) => {
      const habit = prev.find((h) => h.id === id)
      if (!habit) return prev
      const newValue = !habit.is_completed
      supabase.from('habits').update({ is_completed: newValue }).eq('id', id).then()
      return prev.map((h) => (h.id === id ? { ...h, is_completed: newValue } : h))
    })
  }, [])

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
      if (data) {
        setHabits((prev) => [data, ...prev])
      }
    },
    [user],
  )

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
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
      if (data) {
        setTransactions((prev) => [data, ...prev])
      }
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
        toggleHabit,
        addHabit,
        deleteHabit,
        addTransaction,
        deleteTransaction,
        refetchHabits: fetchHabits,
        refetchTransactions: fetchTransactions,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
