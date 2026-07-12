import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/plans'

interface PlanCardProps {
  plan: Plan
  isSelected?: boolean
  isCurrent?: boolean
  onSelect: () => void
}

export function PlanCard({ plan, isSelected, isCurrent, onSelect }: PlanCardProps) {
  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 flex flex-col',
        plan.highlight ? 'border-primary shadow-soft' : 'border-border',
        isSelected && !isCurrent && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          Popular
        </span>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <p className="text-2xl font-bold tracking-tight">{plan.price}</p>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={onSelect}
          variant={isCurrent ? 'outline' : plan.highlight ? 'default' : 'outline'}
          className="w-full"
          disabled={isCurrent}
        >
          {isCurrent ? 'Plano Atual' : isSelected ? 'Selecionado' : 'Selecionar'}
        </Button>
      </CardContent>
    </Card>
  )
}
