import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

type ChartDataItem = { day: string; count: number; date: string }

export function HabitProgressChart({
  data,
  maxHabits,
}: {
  data: ChartDataItem[]
  maxHabits: number
}) {
  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="text-primary" size={20} />
          Progresso (7 dias)
        </CardTitle>
        <p className="text-sm text-muted-foreground">Hábitos concluídos por dia</p>
      </CardHeader>
      <CardContent className="h-56">
        <ChartContainer config={{ count: { label: 'Concluídos', color: 'hsl(var(--primary))' } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis
                domain={[0, maxHabits || 1]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
