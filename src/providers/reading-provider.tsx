import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type ReadingItem = Database['public']['Tables']['reading_list']['Row']
export type ReadingStatus = 'quero_ler' | 'lendo' | 'lido'

interface ReadingContextType {
  readingList: ReadingItem[]
  loading: boolean
  addBook: (book: {
    googleBooksId?: string | null
    title: string
    author?: string | null
    coverUrl?: string | null
  }) => Promise<void>
  updateStatus: (id: string, status: ReadingStatus) => Promise<void>
  removeBook: (id: string) => Promise<void>
  refetchReadingList: () => Promise<void>
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined)

export function useReading() {
  const ctx = useContext(ReadingContext)
  if (!ctx) throw new Error('useReading must be used within ReadingProvider')
  return ctx
}

export function ReadingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [readingList, setReadingList] = useState<ReadingItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReadingList = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('reading_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setReadingList(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchReadingList()
    } else {
      setReadingList([])
      setLoading(false)
    }
  }, [user, fetchReadingList])

  const addBook = useCallback(
    async (book: {
      googleBooksId?: string | null
      title: string
      author?: string | null
      coverUrl?: string | null
    }) => {
      if (!user) return
      const { data, error } = await supabase
        .from('reading_list')
        .insert({
          user_id: user.id,
          google_books_id: book.googleBooksId || null,
          title: book.title,
          author: book.author || null,
          cover_url: book.coverUrl || null,
          status: 'quero_ler',
        })
        .select()
        .single()
      if (!error && data) setReadingList((prev) => [data, ...prev])
    },
    [user],
  )

  const updateStatus = useCallback(async (id: string, status: ReadingStatus) => {
    setReadingList((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    await supabase.from('reading_list').update({ status }).eq('id', id)
  }, [])

  const removeBook = useCallback(async (id: string) => {
    setReadingList((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('reading_list').delete().eq('id', id)
  }, [])

  return (
    <ReadingContext.Provider
      value={{
        readingList,
        loading,
        addBook,
        updateStatus,
        removeBook,
        refetchReadingList: fetchReadingList,
      }}
    >
      {children}
    </ReadingContext.Provider>
  )
}
