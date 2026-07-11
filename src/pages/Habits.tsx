import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import useHabitsStore from '@/stores/useHabitsStore'
import { getTodayStr, getLastNDays } from '@/lib/date-utils'
import { CheckCircle2, Circle, Calendar, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddCard } from '@/components/AddCard'
import { HabitAddDialog } from '@/components/HabitAddDialog'

const freqLabel: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export default function Habits() {
  const { habits, toggleHabit, deleteHabit } = useHabitsStore()
  const days = getLastNDays(7)
  const today = getTodayStr()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Rastreador de Hábitos</h1>
        <p className="text-muted-foreground">
          Mantenha a consistência para alcançar seus objetivos.
        </p>
      </div>

      <div className="overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-4 min-w-max">
          {days.map((date) => {
            const isToday = date === today
            const dayName = new Date(date)
              .toLocaleDateString('pt-BR', { weekday: 'short' })
              .replace('.', '')
            const dayNum = date.split('-')[2]
            return (
              <div
                key={date}
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-colors',
                  isToday
                    ? 'bg-primary text-primary-foreground shadow-elevation'
                    : 'bg-white dark:bg-slate-900 border border-border/50 text-muted-foreground',
                )}
              >
                <span className="text-xs font-medium uppercase">{dayName}</span>
                <span className="text-xl font-bold">{dayNum}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4">
        {habits.map((habit) => {
          const isDoneToday = habit.is_completed
          return (
            <Card
              key={habit.id}
              className="glass-card border-none rounded-2xl overflow-hidden group"
            >
              <CardContent className="p-0 flex items-center justify-between">
                <div className="p-6 flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">
                    {isDoneToday ? '✅' : '🌟'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{habit.title}</h3>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{habit.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {freqLabel[habit.frequency] || 'Diária'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className="px-8 h-full flex items-center justify-center transition-all duration-300 border-l border-border/50 hover:bg-muted/30"
                >
                  {isDoneToday ? (
                    <CheckCircle2 size={36} className="text-primary animate-check-pop" />
                  ) : (
                    <Circle
                      size={36}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  )}
                </button>
              </CardContent>
            </Card>
          )
        })}
        <AddCard onClick={() => setAddOpen(true)} className="min-h-[88px]" />
      </div>

      <HabitAddDialog open={addOpen} setOpen={setAddOpen} />
    </div>
  )
}
