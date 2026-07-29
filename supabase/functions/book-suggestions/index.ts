import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface BookResult {
  googleBooksId: string | null
  title: string
  author: string | null
  coverUrl: string | null
  description: string | null
}

// Seed queries for the curated "Plano de Leitura" — classics of habits, productivity,
// mindset and personal finance, matching Vértice's own pillars.
const CURATED_QUERIES = [
  'Hábitos Atômicos James Clear',
  'O Poder do Hábito Charles Duhigg',
  'Mindset A Nova Psicologia do Sucesso Carol Dweck',
  'Pai Rico Pai Pobre Robert Kiyosaki',
  'O Homem Mais Rico da Babilônia George Clason',
  'Essencialismo Greg McKeown',
  'Trabalho Focado Cal Newport',
  'Os 7 Hábitos das Pessoas Altamente Eficazes Stephen Covey',
]

// Static fallback so the feature never ships empty if Google Books is down or
// rate-limited (no API key is used, so quota is shared and can run dry).
const CURATED_FALLBACK: BookResult[] = [
  {
    googleBooksId: null,
    title: 'Hábitos Atômicos',
    author: 'James Clear',
    coverUrl: null,
    description: 'Um método comprovado para criar bons hábitos e eliminar os maus.',
  },
  {
    googleBooksId: null,
    title: 'O Poder do Hábito',
    author: 'Charles Duhigg',
    coverUrl: null,
    description: 'Por que fazemos o que fazemos na vida e nos negócios.',
  },
  {
    googleBooksId: null,
    title: 'Mindset',
    author: 'Carol Dweck',
    coverUrl: null,
    description: 'A nova psicologia do sucesso.',
  },
  {
    googleBooksId: null,
    title: 'Pai Rico, Pai Pobre',
    author: 'Robert Kiyosaki',
    coverUrl: null,
    description: 'O que os ricos ensinam a seus filhos sobre dinheiro.',
  },
  {
    googleBooksId: null,
    title: 'O Homem Mais Rico da Babilônia',
    author: 'George S. Clason',
    coverUrl: null,
    description: 'Princípios atemporais de prosperidade financeira.',
  },
  {
    googleBooksId: null,
    title: 'Essencialismo',
    author: 'Greg McKeown',
    coverUrl: null,
    description: 'A disciplinada busca por menos.',
  },
  {
    googleBooksId: null,
    title: 'Trabalho Focado',
    author: 'Cal Newport',
    coverUrl: null,
    description: 'Regras para o sucesso em um mundo distraído.',
  },
  {
    googleBooksId: null,
    title: 'Os 7 Hábitos das Pessoas Altamente Eficazes',
    author: 'Stephen Covey',
    coverUrl: null,
    description: 'Lições poderosas para a mudança pessoal.',
  },
]

function mapVolume(item: any): BookResult | null {
  const info = item?.volumeInfo
  if (!info?.title) return null
  return {
    googleBooksId: item.id || null,
    title: info.title,
    author: Array.isArray(info.authors) ? info.authors.join(', ') : null,
    coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    description: info.description ? String(info.description).slice(0, 300) : null,
  }
}

async function googleBooksSearch(query: string, maxResults = 1): Promise<BookResult[]> {
  try {
    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY')
    const params = new URLSearchParams({ q: query, maxResults: String(maxResults) })
    if (apiKey) params.set('key', apiKey)

    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const items = Array.isArray(data.items) ? data.items : []
    return items.map(mapVolume).filter((b: BookResult | null): b is BookResult => !!b)
  } catch {
    return []
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === 'search' ? 'search' : 'curated'

    if (mode === 'search') {
      const query = String(body.query || '').trim()
      if (!query) {
        return new Response(JSON.stringify({ books: [] }), { headers: jsonHeaders })
      }
      const books = await googleBooksSearch(query, 10)
      return new Response(JSON.stringify({ books }), { headers: jsonHeaders })
    }

    const results = await Promise.all(CURATED_QUERIES.map((q) => googleBooksSearch(q, 1)))
    const books = results.map((r, i) => r[0] || CURATED_FALLBACK[i])

    return new Response(JSON.stringify({ books }), { headers: jsonHeaders })
  } catch {
    return new Response(JSON.stringify({ books: CURATED_FALLBACK }), { headers: jsonHeaders })
  }
})
