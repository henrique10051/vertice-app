import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import useHabitsStore from '@/stores/useHabitsStore'
import { getTodayStr, addDays, formatDateLongPT, dateToStr, strToDate } from '@/lib/date-utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddCard } from '@/components/AddCard'
import { HabitAddDialog } from '@/components/HabitAddDialog'
import { HabitProgressChart } from '@/components/HabitProgressChart'
import { HabitCard } from '@/components/HabitCard'
import { ptBR } from 'date-fns/locale'

export default function Habits() {
  const {
    habits,
    toggleHabitForDate,
    deleteHabit,
    habitLogsByDate,
    fetchHabitLogsForDate,
    fetchHabitLogsRange,
  } = useHabitsStore()
  const today = getTodayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [addOpen, setAddOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(selectedDate, -(6 - i))),
    [selectedDate],
  )
  const selectedDateObj = useMemo(() => strToDate(selectedDate), [selectedDate])

  useEffect(() => {
    fetchHabitLogsForDate(selectedDate)
  }, [selectedDate, fetchHabitLogsForDate])

  useEffect(() => {
    fetchHabitLogsRange(days[0], days[days.length - 1])
  }, [habits.length, fetchHabitLogsRange, days])

  const completedIds = habitLogsByDate[selectedDate] || []

  const chartData = useMemo(() => {
    return days.map((date) => {
      const count = habitLogsByDate[date]?.length || 0
      const dayName = strToDate(date)
        .toLocaleDateString('pt-BR', { weekday: 'short' })
        .replace('.', '')
      return { day: dayName, count, date }
    })
  }, [days, habitLogsByDate])

  const consistencyByHabit = useMemo(() => {
    const map: Record<string, { completedDays: number; totalDays: number }> = {}
    habits.forEach((habit) => {
      const completedDays = days.filter((date) =>
        (habitLogsByDate[date] || []).includes(habit.id),
      ).length
      map[habit.id] = { completedDays, totalDays: days.length }
    })
    return map
  }, [habits, days, habitLogsByDate])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-1">
          Consistência
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Rastreador de Hábitos</h1>
        <p className="text-muted-foreground">
          Mantenha a consistência para alcançar seus objetivos.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="rounded-xl"
          >
            <ChevronLeft size={18} />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl min-w-[200px] capitalize">
                {formatDateLongPT(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDateObj}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(dateToStr(date))
                    setCalendarOpen(false)
                  }
                }}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-xl"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
        {selectedDate !== today && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(today)}
            className="text-primary"
          >
            Voltar para hoje
          </Button>
        )}
      </div>

      <HabitProgressChart data={chartData} maxHabits={habits.length} />

      <div className="overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-3 min-w-max">
          {days.map((date) => {
            const isSelected = date === selectedDate
            const isToday = date === today
            const dayName = strToDate(date)
              .toLocaleDateString('pt-BR', { weekday: 'short' })
              .replace('.', '')
            const dayNum = date.split('-')[2]
            const completedCount = habitLogsByDate[date]?.length || 0
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-elevation scale-105'
                    : isToday
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-card border border-border/60 text-muted-foreground hover:border-primary/40',
                )}
              >
                <span className="text-xs font-medium uppercase">{dayName}</span>
                <span className="data-num text-xl font-bold">{dayNum}</span>
                {completedCount > 0 && (
                  <span className="data-num text-[10px] mt-0.5">
                    {completedCount}/{habits.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4">
        {habits.map((habit) => {
          const isDone = completedIds.includes(habit.id)
          const consistency = consistencyByHabit[habit.id] || { completedDays: 0, totalDays: 7 }
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              isDone={isDone}
              completedDays={consistency.completedDays}
              totalDays={consistency.totalDays}
              onToggle={() => toggleHabitForDate(habit.id, selectedDate)}
              onDelete={() => deleteHabit(habit.id)}
            />
          )
        })}
        <AddCard onClick={() => setAddOpen(true)} className="min-h-[88px]" />
      </div>

      <HabitAddDialog open={addOpen} setOpen={setAddOpen} />
    </div>
  )
}
