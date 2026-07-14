import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  /** Honest secondary reading (e.g. "3 de 8 concluídos"). No fabricated deltas. */
  hint?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
}: MetricCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-[box-shadow,transform] duration-200 ease-out-quart hover:-translate-y-0.5 hover:shadow-elevation">
      <CardContent className="p-5">
        <div className="mb-4">
          <div className={cn('inline-flex p-2 rounded-lg', iconBg)}>
            <Icon className={iconColor} size={20} strokeWidth={2.25} />
          </div>
        </div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="data-num text-2xl md:text-3xl font-bold tracking-tight mt-1.5 text-foreground">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      </CardContent>
    </Card>
  )
}
