import { ExternalLink } from 'lucide-react'
import type { Article } from '@/services/news'

function timeAgo(pubDate: string | null): string | null {
  if (!pubDate) return null
  const date = new Date(pubDate)
  if (Number.isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'agora há pouco'
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function NewsCard({ article }: { article: Article }) {
  const ago = timeAgo(article.pubDate)

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 rounded-lg border border-border/70 bg-card hover:shadow-elevation hover:border-primary/30 transition-all"
    >
      {article.image && (
        <img
          src={article.image}
          alt=""
          className="w-24 h-24 rounded-md object-cover shrink-0 hidden sm:block"
          loading="lazy"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <span className="font-medium text-primary">{article.source}</span>
          {ago && (
            <>
              <span aria-hidden>·</span>
              <span className="data-num">{ago}</span>
            </>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{article.summary}</p>
        )}
      </div>
      <ExternalLink
        size={16}
        className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}
