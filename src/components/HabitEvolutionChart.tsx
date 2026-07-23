import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

type EvolutionPoint = { date: string; label: string; rate: number }

export function HabitEvolutionChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-primary" size={20} />
          Evolução
        </CardTitle>
        <p className="text-sm text-muted-foreground">Consistência diária nos últimos 30 dias</p>
      </CardHeader>
      <CardContent className="h-56">
        <ChartContainer config={{ rate: { label: 'Consistência (%)', color: 'hsl(var(--primary))' } }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval={4}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
