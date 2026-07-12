import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { HabitConsistencyBar } from '@/components/HabitConsistencyBar'
import type { Habit } from '@/stores/useHabitsStore'

const freqLabel: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

type HabitCardProps = {
  habit: Habit
  isDone: boolean
  completedDays: number
  totalDays: number
  onToggle: () => void
  onDelete: () => void
}

export function HabitCard({
  habit,
  isDone,
  completedDays,
  totalDays,
  onToggle,
  onDelete,
}: HabitCardProps) {
  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="p-6 flex-1 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">
              {isDone ? '✅' : '🌟'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">{habit.title}</h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{habit.description}</p>
              )}
              <span className="text-sm text-muted-foreground font-medium">
                {freqLabel[habit.frequency] || 'Diária'}
              </span>
            </div>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <button
            onClick={onToggle}
            className="px-8 h-full flex items-center justify-center transition-all duration-300 border-l border-border/50 hover:bg-muted/30"
          >
            {isDone ? (
              <CheckCircle2 size={36} className="text-primary animate-check-pop" />
            ) : (
              <Circle
                size={36}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            )}
          </button>
        </div>
        <div className="px-6 pb-4 pt-1">
          <HabitConsistencyBar completedDays={completedDays} totalDays={totalDays} />
        </div>
      </CardContent>
    </Card>
  )
}
