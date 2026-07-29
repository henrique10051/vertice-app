import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

type LoadPoint = { date: string; label: string; maxWeight: number }

export function WorkoutEvolutionChart({
  exerciseName,
  data,
}: {
  exerciseName: string
  data: LoadPoint[]
}) {
  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="text-primary" size={20} />
          Progressão de Carga
        </CardTitle>
        <p className="text-sm text-muted-foreground">{exerciseName} — carga máxima por sessão</p>
      </CardHeader>
      <CardContent className="h-56">
        {data.length > 0 ? (
          <ChartContainer
            config={{ maxWeight: { label: 'Carga (kg)', color: 'hsl(var(--primary))' } }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}kg`}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Registre séries para ver a evolução
          </div>
        )}
      </CardContent>
    </Card>
  )
}
