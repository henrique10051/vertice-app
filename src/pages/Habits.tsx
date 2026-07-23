import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import useHabitsStore from '@/stores/useHabitsStore'
import { getTodayStr, addDays, formatDateLongPT, dateToStr, strToDate } from '@/lib/date-utils'
import { computeStreak, computeLongestStreak } from '@/lib/habit-stats'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddCard } from '@/components/AddCard'
import { HabitAddDialog } from '@/components/HabitAddDialog'
import { HabitStatsCards } from '@/components/HabitStatsCards'
import { HabitEvolutionChart } from '@/components/HabitEvolutionChart'
import { HabitCard } from '@/components/HabitCard'
import { ptBR } from 'date-fns/locale'

const HISTORY_DAYS = 30

export default function Habits() {
  const {
    habits,
    toggleHabitForDate,
    updateHabit,
    deleteHabit,
    habitLogsByDate,
    fetchHabitLogsForDate,
    fetchHabitLogsRange,
  } = useHabitsStore()
  const today = getTodayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [addOpen, setAddOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const visibleDays = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(selectedDate, i - 2)),
    [selectedDate],
  )
  const historyDays = useMemo(
    () => Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(today, -(HISTORY_DAYS - 1 - i))),
    [today],
  )
  const last7Days = useMemo(() => historyDays.slice(-7), [historyDays])
  const selectedDateObj = useMemo(() => strToDate(selectedDate), [selectedDate])

  useEffect(() => {
    fetchHabitLogsForDate(selectedDate)
  }, [selectedDate, fetchHabitLogsForDate])

  useEffect(() => {
    fetchHabitLogsRange(historyDays[0], historyDays[historyDays.length - 1])
  }, [habits.length, fetchHabitLogsRange, historyDays])

  const completedIds = habitLogsByDate[selectedDate] || []

  const evolutionData = useMemo(() => {
    return historyDays.map((date) => {
      const count = habitLogsByDate[date]?.length || 0
      const rate = habits.length > 0 ? Math.round((count / habits.length) * 100) : 0
      const label = strToDate(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      return { date, label, rate }
    })
  }, [historyDays, habitLogsByDate, habits.length])

  const activeOverallDates = useMemo(() => {
    const set = new Set<string>()
    historyDays.forEach((date) => {
      if ((habitLogsByDate[date]?.length || 0) > 0) set.add(date)
    })
    return set
  }, [historyDays, habitLogsByDate])

  const currentStreak = useMemo(
    () => computeStreak(activeOverallDates, today),
    [activeOverallDates, today],
  )
  const bestStreak = useMemo(
    () => Math.max(currentStreak, computeLongestStreak(activeOverallDates)),
    [activeOverallDates, currentStreak],
  )

  const last7DaysRates = useMemo(
    () =>
      last7Days.map((date) => {
        const count = habitLogsByDate[date]?.length || 0
        return habits.length > 0 ? Math.round((count / habits.length) * 100) : 0
      }),
    [last7Days, habitLogsByDate, habits.length],
  )
  const consistencyPercent = useMemo(() => {
    if (last7DaysRates.length === 0) return 0
    return Math.round(last7DaysRates.reduce((a, b) => a + b, 0) / last7DaysRates.length)
  }, [last7DaysRates])

  const habitStreaks = useMemo(() => {
    const map: Record<string, { streak: number; recentDays: boolean[] }> = {}
    habits.forEach((habit) => {
      const activeDates = new Set<string>()
      historyDays.forEach((date) => {
        if ((habitLogsByDate[date] || []).includes(habit.id)) activeDates.add(date)
      })
      map[habit.id] = {
        streak: computeStreak(activeDates, today),
        recentDays: last7Days.map((date) => activeDates.has(date)),
      }
    })
    return map
  }, [habits, historyDays, habitLogsByDate, today, last7Days])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <HabitStatsCards
        completedToday={completedIds.length}
        totalHabits={habits.length}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        consistencyPercent={consistencyPercent}
        last7DaysRates={last7DaysRates}
      />

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

      <div className="overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex gap-3 min-w-max">
          {visibleDays.map((date) => {
            const isSelected = date === selectedDate
            const isToday = date === today
            const dayName = strToDate(date)
              .toLocaleDateString('pt-BR', { weekday: 'short' })
              .replace('.', '')
            const dayNum = date.split('-')[2]
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center justify-center w-24 h-16 rounded-2xl transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-elevation'
                    : isToday
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-card border border-border/60 text-muted-foreground hover:border-primary/40',
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">{dayName}</span>
                <span className="data-num text-xl font-bold">{dayNum}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3">
        {habits.map((habit) => {
          const isDone = completedIds.includes(habit.id)
          const { streak, recentDays } = habitStreaks[habit.id] || { streak: 0, recentDays: [] }
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              isDone={isDone}
              streak={streak}
              recentDays={recentDays}
              onToggle={() => toggleHabitForDate(habit.id, selectedDate)}
              onDelete={() => deleteHabit(habit.id)}
              onScheduleChange={(time, durationMinutes) =>
                updateHabit(habit.id, { scheduled_time: time, duration_minutes: durationMinutes })
              }
            />
          )
        })}
        <AddCard onClick={() => setAddOpen(true)} className="min-h-[72px]" />
      </div>

      <HabitEvolutionChart data={evolutionData} />

      <HabitAddDialog open={addOpen} setOpen={setAddOpen} />
    </div>
  )
}
