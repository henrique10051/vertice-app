import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
}: MetricCardProps) {
  const isPositive = change >= 0

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('p-2 rounded-xl', iconBg)}>
            <Icon className={iconColor} size={20} />
          </div>
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-muted-foreground text-xs md:text-sm font-medium">{title}</p>
        <p className="text-xl md:text-2xl font-bold tracking-tight mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
