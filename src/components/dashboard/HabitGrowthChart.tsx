import { useEffect, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import useHabitsStore from '@/stores/useHabitsStore'
import { getTodayStr, addDays, strToDate } from '@/lib/date-utils'

const HISTORY_DAYS = 30

export function HabitGrowthChart() {
  const { habits, habitLogsByDate, fetchHabitLogsRange } = useHabitsStore()
  const today = getTodayStr()
  const historyDays = useMemo(
    () => Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(today, -(HISTORY_DAYS - 1 - i))),
    [today],
  )

  useEffect(() => {
    fetchHabitLogsRange(historyDays[0], historyDays[historyDays.length - 1])
  }, [habits.length, fetchHabitLogsRange, historyDays])

  const data = useMemo(
    () =>
      historyDays.map((date) => {
        const count = habitLogsByDate[date]?.length || 0
        const rate = habits.length > 0 ? Math.round((count / habits.length) * 100) : 0
        const day = strToDate(date).toLocaleDateString('pt-BR', { weekday: 'short' })
        return { date, day, rate }
      }),
    [historyDays, habitLogsByDate, habits.length],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="text-primary" size={20} />
          Crescimento Pessoal
        </CardTitle>
        <p className="text-sm text-muted-foreground">Consistência de hábitos (30 dias)</p>
      </CardHeader>
      <CardContent className="h-56">
        <ChartContainer config={{ rate: { label: 'Conclusão (%)', color: 'hsl(var(--primary))' } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
