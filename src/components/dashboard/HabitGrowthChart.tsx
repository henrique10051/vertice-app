import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { generateHabitConsistencyData } from '@/lib/mock-data'

export function HabitGrowthChart() {
  const data = useMemo(() => generateHabitConsistencyData(30), [])

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
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
