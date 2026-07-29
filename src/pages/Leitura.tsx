import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NewsCard } from '@/components/NewsCard'
import { BookCard } from '@/components/BookCard'
import { fetchNews, type Article, type NewsCategory } from '@/services/news'
import { fetchCuratedBooks, searchBooks, type BookResult } from '@/services/books'
import useReadingStore, { type ReadingStatus } from '@/stores/useReadingStore'
import { BookOpen, Loader2, Newspaper, Search, Trash2 } from 'lucide-react'

const CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: 'desenvolvimento_pessoal', label: 'Desenvolvimento Pessoal' },
  { value: 'politica', label: 'Política' },
  { value: 'economia', label: 'Economia' },
]

const STATUS_LABELS: Record<ReadingStatus, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
}

function NewsTab() {
  const [category, setCategory] = useState<NewsCategory>('desenvolvimento_pessoal')
  const [articlesByCategory, setArticlesByCategory] = useState<
    Partial<Record<NewsCategory, Article[]>>
  >({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (articlesByCategory[category]) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchNews(category).then((articles) => {
      setArticlesByCategory((prev) => ({ ...prev, [category]: articles }))
      setLoading(false)
    })
  }, [category, articlesByCategory])

  const articles = articlesByCategory[category] || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={category === c.value ? 'default' : 'outline'}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Carregando notícias...
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((a, i) => (
            <NewsCard key={`${a.link}-${i}`} article={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Newspaper size={28} className="mx-auto mb-2 opacity-50" />
          <p>Não conseguimos carregar as notícias agora. Tente novamente em instantes.</p>
        </div>
      )}
    </div>
  )
}

function ReadingPlanTab() {
  const { readingList, addBook, updateStatus, removeBook } = useReadingStore()
  const [curated, setCurated] = useState<BookResult[]>([])
  const [loadingCurated, setLoadingCurated] = useState(true)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchCuratedBooks().then((books) => {
      setCurated(books)
      setLoadingCurated(false)
    })
  }, [])

  const addedIds = useMemo(
    () => new Set(readingList.map((b) => b.google_books_id).filter(Boolean)),
    [readingList],
  )
  const addedTitles = useMemo(() => new Set(readingList.map((b) => b.title)), [readingList])

  const isAdded = (book: BookResult) =>
    (book.googleBooksId && addedIds.has(book.googleBooksId)) || addedTitles.has(book.title)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const results = await searchBooks(query)
    setSearchResults(results)
    setSearching(false)
  }

  const grouped: Record<ReadingStatus, typeof readingList> = {
    lendo: readingList.filter((b) => b.status === 'lendo'),
    quero_ler: readingList.filter((b) => b.status === 'quero_ler'),
    lido: readingList.filter((b) => b.status === 'lido'),
  }

  return (
    <div className="space-y-8">
      {readingList.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Minha Lista</h2>
          {(['lendo', 'quero_ler', 'lido'] as ReadingStatus[]).map(
            (status) =>
              grouped[status].length > 0 && (
                <div key={status} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </p>
                  {grouped[status].map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-card"
                    >
                      <div className="w-10 h-14 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                        {b.cover_url ? (
                          <img src={b.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{b.title}</p>
                        {b.author && (
                          <p className="text-xs text-muted-foreground truncate">{b.author}</p>
                        )}
                      </div>
                      <Select
                        value={b.status}
                        onValueChange={(v) => updateStatus(b.id, v as ReadingStatus)}
                      >
                        <SelectTrigger className="w-32 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quero_ler">Quero ler</SelectItem>
                          <SelectItem value="lendo">Lendo</SelectItem>
                          <SelectItem value="lido">Lido</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => removeBook(b.id)}
                        aria-label="Remover da lista"
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ),
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Buscar Livros</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por título ou autor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={searching} className="gap-2 shrink-0">
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar
          </Button>
        </form>
        {searchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.length > 0 ? (
              searchResults.map((b, i) => (
                <BookCard
                  key={b.googleBooksId || `${b.title}-${i}`}
                  book={b}
                  added={isAdded(b)}
                  onAdd={() =>
                    addBook({
                      googleBooksId: b.googleBooksId,
                      title: b.title,
                      author: b.author,
                      coverUrl: b.coverUrl,
                    })
                  }
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 col-span-full">
                Nenhum livro encontrado para "{query}".
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Sugestões para Você</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Clássicos de hábitos, foco e finanças pessoais — os pilares do Vértice.
        </p>
        {loadingCurated ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" /> Carregando sugestões...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {curated.map((b, i) => (
              <BookCard
                key={b.googleBooksId || `${b.title}-${i}`}
                book={b}
                added={isAdded(b)}
                onAdd={() =>
                  addBook({
                    googleBooksId: b.googleBooksId,
                    title: b.title,
                    author: b.author,
                    coverUrl: b.coverUrl,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Leitura() {
  const [tab, setTab] = useState('noticias')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Leitura</h1>
        <p className="text-muted-foreground">
          Notícias relevantes e um plano de leitura para o seu crescimento.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted/60 backdrop-blur-md rounded-xl p-1 mb-6">
          <TabsTrigger value="noticias" className="rounded-lg">
            Notícias
          </TabsTrigger>
          <TabsTrigger value="plano-leitura" className="rounded-lg">
            Plano de Leitura
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'noticias' ? <NewsTab /> : <ReadingPlanTab />}
    </div>
  )
}
