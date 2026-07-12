import { CheckCircle2, Loader2, BookOpen, Repeat, Timer, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import type { ProposedHabit } from '@/services/mentor-chat'

interface MentorRoadmapPreviewProps {
  content: string
  habits: ProposedHabit[]
  created: boolean
  creating: boolean
  onConfirm: () => void
  onRestart: () => void
}

const freqLabel: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export function MentorRoadmapPreview({
  content,
  habits,
  created,
  creating,
  onConfirm,
  onRestart,
}: MentorRoadmapPreviewProps) {
  const totalSessions = habits.reduce((sum, h) => sum + (h.pomodoroSessions || 0), 0)
  const totalStudyMin = habits.reduce(
    (sum, h) => sum + (h.pomodoroSessions || 0) * (h.pomodoroMinutes || 25),
    0,
  )

  return (
    <Card className="glass-card rounded-3xl border-none shadow-soft p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Calendar className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Cronograma de Crescimento</h2>
          <p className="text-sm text-muted-foreground">
            {habits.length} hábitos
            {totalSessions > 0 &&
              ` • ${totalSessions} sessões de Pomodoro • ${totalStudyMin} min de estudo`}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{content}</p>

      <div className="space-y-3 mb-6">
        {habits.map((habit, i) => (
          <div
            key={i}
            className="flex gap-3 p-4 rounded-2xl bg-background/60 border border-border/50"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{habit.title}</h3>
                {habit.pomodoroSessions && habit.pomodoroSessions > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <Timer size={10} />
                    {habit.pomodoroSessions}× {habit.pomodoroMinutes || 25}/
                    {habit.breakMinutes || 5} min
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <Repeat size={10} />
                  {freqLabel[habit.frequency] || 'Diária'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{habit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {created ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 className="text-green-500" size={48} />
          <p className="font-semibold text-center">
            Hábitos criados! Acesse seu rastreador para começar.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/habitos">Ir para Hábitos</Link>
            </Button>
            <Button variant="outline" onClick={onRestart}>
              Nova Entrevista
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={onConfirm} disabled={creating}>
          {creating ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Criando hábitos...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} className="mr-2" />
              Confirmar e Criar Hábitos
            </>
          )}
        </Button>
      )}
    </Card>
  )
}
