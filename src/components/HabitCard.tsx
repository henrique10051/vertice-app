import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Trash2, Clock, Check } from 'lucide-react'
import { HabitConsistencyBar } from '@/components/HabitConsistencyBar'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import type { Habit } from '@/stores/useHabitsStore'

const freqLabel: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const durationLabel = (minutes: number) =>
  DURATION_OPTIONS.find((d) => d.value === minutes)?.label ?? `${minutes} min`

type HabitCardProps = {
  habit: Habit
  isDone: boolean
  completedDays: number
  totalDays: number
  onToggle: () => void
  onDelete: () => void
  onScheduleChange: (time: string | null, durationMinutes: number) => void
}

export function HabitCard({
  habit,
  isDone,
  completedDays,
  totalDays,
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
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm text-muted-foreground font-medium">
                  {freqLabel[habit.frequency] || 'Diária'}
                </span>
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
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 hover:bg-primary/20 transition-colors"
                  >
                    <Clock size={11} />
                    {habit.scheduled_time
                      ? `${habit.scheduled_time.slice(0, 5)} · ${durationLabel(habit.duration_minutes || 30)}`
                      : 'Definir horário'}
                  </button>
                )}
              </div>
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
