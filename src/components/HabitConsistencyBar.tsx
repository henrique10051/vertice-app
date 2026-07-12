import { Progress } from '@/components/ui/progress'

type HabitConsistencyBarProps = {
  completedDays: number
  totalDays: number
}

export function HabitConsistencyBar({ completedDays, totalDays }: HabitConsistencyBarProps) {
  const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Consistência</span>
          <span className="font-bold text-foreground">
            {completedDays}/{totalDays} dias
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </div>
  )
}
