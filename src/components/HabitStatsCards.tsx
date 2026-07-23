import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type HabitStatsCardsProps = {
  completedToday: number
  totalHabits: number
  currentStreak: number
  bestStreak: number
  consistencyPercent: number
  last7DaysRates: number[]
}

export function HabitStatsCards({
  completedToday,
  totalHabits,
  currentStreak,
  bestStreak,
  consistencyPercent,
  last7DaysRates,
}: HabitStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="glass-card border-none rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Hoje
          </p>
          <p className="text-2xl font-bold data-num">
            {completedToday} <span className="text-base font-medium text-muted-foreground">/ {totalHabits} concluídos</span>
          </p>
          <Progress
            value={totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}
            className="h-2"
          />
        </CardContent>
      </Card>

      <Card className="glass-card border-none rounded-2xl">
        <CardContent className="p-5 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Sequência atual
          </p>
          <p className="text-2xl font-bold data-num flex items-center gap-1.5">
            {currentStreak} <span className="text-base font-medium text-muted-foreground">dias</span>
            <Flame size={20} className="text-amber-500 fill-amber-500" />
          </p>
          <p className="text-xs text-muted-foreground data-num">
            Recorde pessoal: {bestStreak} dias
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none rounded-2xl">
        <CardContent className="p-5 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Consistência (7 dias)
          </p>
          <p className="text-2xl font-bold data-num">{consistencyPercent}%</p>
          <div className="flex items-end gap-1 h-4">
            {last7DaysRates.map((rate, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-full',
                  rate > 0 ? 'bg-amber-500' : 'bg-muted-foreground/20',
                )}
                style={{ height: `${Math.max(rate, 12)}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
