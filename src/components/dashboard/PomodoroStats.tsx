import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Flame } from 'lucide-react'

export function PomodoroStats({
  totalMinutes,
  sessionCount,
}: {
  totalMinutes: number
  sessionCount: number
}) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="text-primary" /> Tempo de Foco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight">
          {hours > 0 ? `${hours}h ` : ''}
          {minutes}min
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {sessionCount} sessão(ões) concluída(s)
        </p>
        <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-primary/5">
          <Flame size={18} className="text-orange-500" />
          <span className="text-sm font-medium">
            {sessionCount > 0
              ? `${Math.round(totalMinutes / sessionCount)} min por sessão`
              : 'Comece a focar!'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
