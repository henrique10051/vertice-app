import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AddCard({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-transparent transition-all duration-300 hover:border-primary hover:bg-primary/5 group/add',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground group-hover/add:text-primary transition-colors">
        <Plus size={24} />
        <span className="text-sm font-semibold">Adicionar</span>
      </div>
    </button>
  )
}
