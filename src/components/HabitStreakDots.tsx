import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type HabitStreakDotsProps = {
  streak: number
  /** true/false per day, oldest first, most recent last */
  recentDays: boolean[]
}

export function HabitStreakDots({ streak, recentDays }: HabitStreakDotsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 data-num">
        <Flame size={13} className="fill-amber-500" />
        {streak}
      </span>
      <div className="flex items-center gap-1">
        {recentDays.map((done, i) => (
          <span
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              done ? 'bg-amber-500' : 'bg-muted-foreground/20',
            )}
          />
        ))}
      </div>
    </div>
  )
}
