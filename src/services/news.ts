import { supabase } from '@/lib/supabase/client'

export type NewsCategory = 'desenvolvimento_pessoal' | 'politica' | 'economia'

export interface Article {
  title: string
  link: string
  source: string
  pubDate: string | null
  summary: string
  image: string | null
}

export async function fetchNews(category: NewsCategory): Promise<Article[]> {
  const { data, error } = await supabase.functions.invoke(
    `news-feed?category=${encodeURIComponent(category)}`,
  )
  if (error || !data?.articles) return []
  return data.articles as Article[]
}
