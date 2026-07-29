import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FEEDS: Record<string, { url: string; source: string }[]> = {
  desenvolvimento_pessoal: [
    { url: 'https://fs.blog/feed/', source: 'Farnam Street' },
    { url: 'https://nesslabs.com/feed', source: 'Ness Labs' },
    { url: 'https://tim.blog/feed/', source: 'The Tim Ferriss Show' },
  ],
  politica: [
    { url: 'https://g1.globo.com/rss/g1/politica/', source: 'G1 Política' },
    { url: 'https://www.poder360.com.br/feed/', source: 'Poder360' },
  ],
  economia: [
    { url: 'https://g1.globo.com/rss/g1/economia/', source: 'G1 Economia' },
    { url: 'https://www.infomoney.com.br/feed/', source: 'InfoMoney' },
  ],
}

const CACHE_TTL_MS = 30 * 60 * 1000

interface Article {
  title: string
  link: string
  source: string
  pubDate: string | null
  summary: string
  image: string | null
}

function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!m) return null
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function parseRss(xml: string, source: string): Article[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || []
  return items.slice(0, 8).map((item) => {
    const title = decodeEntities(extractTag(item, 'title') || '')
    const link = (extractTag(item, 'link') || '').trim()
    const pubDate = extractTag(item, 'pubDate')
    const descriptionRaw = extractTag(item, 'description') || ''
    const summary = stripTags(descriptionRaw).slice(0, 220)
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/i)
    const imgMatch = descriptionRaw.match(/<img[^>]*src="([^"]+)"/i)
    const image = mediaMatch?.[1] || imgMatch?.[1] || null
    return { title, link, source, pubDate, summary, image }
  })
}

async function fetchFeed(url: string, source: string): Promise<Article[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const buf = await res.arrayBuffer()
    const head = new TextDecoder('utf-8').decode(buf.slice(0, 200))
    const encMatch = head.match(/encoding=["']([^"']+)["']/i)
    const encoding = encMatch?.[1]?.toLowerCase() || 'utf-8'
    let xml: string
    try {
      xml = new TextDecoder(encoding).decode(buf)
    } catch {
      xml = new TextDecoder('utf-8').decode(buf)
    }
    return parseRss(xml, source)
  } catch {
    return []
  }
}

async function buildCategory(category: string): Promise<Article[]> {
  const feeds = FEEDS[category] || []
  const results = await Promise.all(feeds.map((f) => fetchFeed(f.url, f.source)))
  const all = results.flat().filter((a) => a.title && a.link)
  all.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  })
  return all
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'desenvolvimento_pessoal'
    if (!FEEDS[category]) {
      return new Response(JSON.stringify({ error: 'invalid category' }), {
        status: 400,
        headers: jsonHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: cached } = await supabase
      .from('news_cache')
      .select('*')
      .eq('category', category)
      .maybeSingle()

    const isFresh =
      cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS

    if (isFresh) {
      return new Response(JSON.stringify({ articles: cached.articles, cached: true }), {
        headers: jsonHeaders,
      })
    }

    const articles = await buildCategory(category)

    if (articles.length > 0) {
      await supabase
        .from('news_cache')
        .upsert({ category, articles, fetched_at: new Date().toISOString() })
    }

    const payload = articles.length > 0 ? articles : cached?.articles || []
    return new Response(JSON.stringify({ articles: payload, cached: articles.length === 0 }), {
      headers: jsonHeaders,
    })
  } catch {
    return new Response(JSON.stringify({ error: 'failed to fetch news' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
