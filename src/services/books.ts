import { supabase } from '@/lib/supabase/client'

export interface BookResult {
  googleBooksId: string | null
  title: string
  author: string | null
  coverUrl: string | null
  description: string | null
}

export async function fetchCuratedBooks(): Promise<BookResult[]> {
  const { data, error } = await supabase.functions.invoke('book-suggestions', {
    body: { mode: 'curated' },
  })
  if (error || !data?.books) return []
  return data.books as BookResult[]
}

export async function searchBooks(query: string): Promise<BookResult[]> {
  if (!query.trim()) return []
  const { data, error } = await supabase.functions.invoke('book-suggestions', {
    body: { mode: 'search', query },
  })
  if (error || !data?.books) return []
  return data.books as BookResult[]
}
