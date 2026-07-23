import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Trash2, Clock, Check } from 'lucide-react'
import { HabitStreakDots } from '@/components/HabitStreakDots'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import type { Habit } from '@/stores/useHabitsStore'

const durationLabel = (minutes: number) =>
  DURATION_OPTIONS.find((d) => d.value === minutes)?.label ?? `${minutes} min`

type HabitCardProps = {
  habit: Habit
  isDone: boolean
  streak: number
  recentDays: boolean[]
  onToggle: () => void
  onDelete: () => void
  onScheduleChange: (time: string | null, durationMinutes: number) => void
}

export function HabitCard({
  habit,
  isDone,
  streak,
  recentDays,
  onToggle,
  onDelete,
  onScheduleChange,
}: HabitCardProps) {
  const [editing, setEditing] = useState(false)
  const [draftTime, setDraftTime] = useState('')
  const [draftDuration, setDraftDuration] = useState(30)

  const startEditing = () => {
    setDraftTime(habit.scheduled_time?.slice(0, 5) || '')
    setDraftDuration(habit.duration_minutes || 30)
    setEditing(true)
  }

  const save = () => {
    onScheduleChange(draftTime || null, draftDuration)
    setEditing(false)
  }

  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-5 py-4">
          <button onClick={onToggle} className="shrink-0">
            {isDone ? (
              <CheckCircle2 size={26} className="text-primary animate-check-pop" />
            ) : (
              <Circle
                size={26}
                className="text-muted-foreground/50 group-hover:text-primary transition-colors"
              />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold leading-tight truncate">{habit.title}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    autoFocus
                    value={draftTime}
                    onChange={(e) => setDraftTime(e.target.value)}
                    className="text-xs rounded-md border border-border/60 bg-background px-1.5 py-0.5"
                  />
                  <select
                    value={draftDuration}
                    onChange={(e) => setDraftDuration(Number(e.target.value))}
                    className="text-xs rounded-md border border-border/60 bg-background px-1.5 py-0.5"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={save}
                    className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors data-num"
                >
                  <Clock size={11} />
                  {habit.scheduled_time
                    ? `${habit.scheduled_time.slice(0, 5)} · ${durationLabel(habit.duration_minutes || 30)}`
                    : 'Definir horário'}
                </button>
              )}
            </div>
          </div>

          <HabitStreakDots streak={streak} recentDays={recentDays} />

          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
