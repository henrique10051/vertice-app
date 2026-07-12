import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function HabitHeatmap({ data }: { data: Record<string, number> }) {
  const weeks = 12
  const totalDays = weeks * 7
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - totalDays + 1)

  const dates: string[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  const weekGroups: string[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weekGroups.push(dates.slice(i, i + 7))
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted'
    if (count === 1) return 'bg-primary/30'
    if (count === 2) return 'bg-primary/50'
    if (count === 3) return 'bg-primary/70'
    return 'bg-primary'
  }

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Consistência de Hábitos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weekGroups.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((date) => (
                <div
                  key={date}
                  className={cn('w-3 h-3 rounded-sm transition-colors', getColor(data[date] || 0))}
                  title={`${date}: ${data[date] || 0} hábito(s)`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-primary/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  )
}
