import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AiUsageStatus } from '@/services/ai-usage'

export function AiUsageBadge({
  status,
  loading,
  compact = false,
  className,
}: {
  status: AiUsageStatus | null
  loading: boolean
  compact?: boolean
  className?: string
}) {
  if (loading || !status) return null

  if (status.limit === 0) {
    return (
      <Link
        to="/planos"
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary rounded-full bg-muted px-3 py-1.5 transition-colors',
          className,
        )}
      >
        <Sparkles size={12} />
        {compact ? 'IA nos planos pagos' : 'Mentor IA nos planos pagos'}
      </Link>
    )
  }

  const remaining = Math.max(status.limit - status.used, 0)
  const ratio = status.used / status.limit
  const low = ratio >= 0.9

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-muted px-3 py-1.5',
        className,
      )}
      title={`${status.used} de ${status.limit} mensagens usadas este mês`}
    >
      <Sparkles size={12} className={low ? 'text-destructive' : 'text-primary'} />
      <span className={cn('data-num', low ? 'text-destructive' : 'text-foreground')}>
        {remaining}
      </span>
      <span className="text-muted-foreground">{compact ? 'restantes' : 'mensagens restantes'}</span>
    </div>
  )
}
