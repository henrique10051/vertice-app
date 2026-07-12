import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import { useAuth } from '@/hooks/use-auth'
import { getPomodoroLogs, type PomodoroLog } from '@/services/pomodoro'
import { Clock, ArrowLeft, Timer as TimerIcon } from 'lucide-react'

export default function Pomodoro() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<PomodoroLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    const { data } = await getPomodoroLogs(user.id)
    setSessions(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter((s) => s.completed_at?.startsWith(today))
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <TimerIcon className="text-primary" size={28} />
          </div>
          Pomodoro
        </h1>
        <p className="text-muted-foreground">
          Foque 25 minutos, descanse 5. Após 4 sessões, faça uma pausa longa de 15 minutos.
        </p>
      </div>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardContent className="p-8">
          <PomodoroTimer onSessionComplete={fetchSessions} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card rounded-2xl border-none">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{todaySessions.length}</p>
            <p className="text-sm text-muted-foreground">Sessões hoje</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl border-none">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{todayMinutes}</p>
            <p className="text-sm text-muted-foreground">Minutos de foco</p>
          </CardContent>
        </Card>
      </div>

      {!loading && todaySessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Histórico de Hoje</h2>
          {todaySessions.map((session) => (
            <Card key={session.id} className="glass-card rounded-xl border-none">
              <CardContent className="p-3 flex items-center gap-3">
                <Clock size={18} className="text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.duration_minutes} min de foco</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.completed_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
