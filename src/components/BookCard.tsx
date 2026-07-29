import { BookOpen, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BookResult } from '@/services/books'

export function BookCard({
  book,
  onAdd,
  added,
}: {
  book: BookResult
  onAdd: () => void
  added: boolean
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-border/70 bg-card">
      <div className="w-16 h-24 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <BookOpen size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{book.title}</h3>
        {book.author && <p className="text-xs text-muted-foreground mt-1">{book.author}</p>}
        {book.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{book.description}</p>
        )}
        <div className="mt-auto pt-2">
          <Button
            size="sm"
            variant={added ? 'secondary' : 'outline'}
            disabled={added}
            onClick={onAdd}
            className="gap-1.5"
          >
            {added ? <Check size={14} /> : <Plus size={14} />}
            {added ? 'Na sua lista' : 'Adicionar à lista'}
          </Button>
        </div>
      </div>
    </div>
  )
}
