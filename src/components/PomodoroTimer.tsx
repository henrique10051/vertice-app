import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createPomodoroLog } from '@/services/pomodoro'
import useHabitsStore from '@/stores/useHabitsStore'

type Mode = 'focus' | 'short-break' | 'long-break'

const MODES: Record<Mode, { duration: number; label: string; color: string }> = {
  focus: { duration: 25 * 60, label: 'Foco', color: 'text-primary' },
  'short-break': { duration: 5 * 60, label: 'Pausa Curta', color: 'text-emerald-500' },
  'long-break': { duration: 15 * 60, label: 'Pausa Longa', color: 'text-blue-500' },
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    /* intentionally ignored */
  }
}

type PomodoroTimerProps = {
  onSessionComplete?: () => void
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { habits } = useHabitsStore()

  const [mode, setMode] = useState<Mode>('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [selectedHabitId, setSelectedHabitId] = useState<string>('none')
  const completingRef = useRef(false)

  const totalDuration = MODES[mode].duration
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100

  const handleComplete = useCallback(async () => {
    if (completingRef.current) return
    completingRef.current = true
    playBeep()
    setIsRunning(false)

    if (mode === 'focus') {
      const newCount = completedSessions + 1
      setCompletedSessions(newCount)
      if (user) {
        const habitId = selectedHabitId !== 'none' ? selectedHabitId : null
        await createPomodoroLog(user.id, habitId, 25)
      }
      toast({ title: 'Sessão de foco concluída!', description: 'Hora de uma pausa.' })
      onSessionComplete?.()
      const nextMode: Mode = newCount % 4 === 0 ? 'long-break' : 'short-break'
      setMode(nextMode)
      setTimeLeft(MODES[nextMode].duration)
    } else {
      toast({ title: 'Pausa concluída!', description: 'Pronto para focar?' })
      setMode('focus')
      setTimeLeft(MODES.focus.duration)
    }
    completingRef.current = false
  }, [mode, completedSessions, selectedHabitId, user, toast, onSessionComplete])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) handleComplete()
  }, [timeLeft, isRunning, handleComplete])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const switchMode = (m: Mode) => {
    setMode(m)
    setTimeLeft(MODES[m].duration)
    setIsRunning(false)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchMode(m)}
            className="rounded-full"
          >
            {MODES[m].label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className={cn('text-7xl font-bold tabular-nums', MODES[mode].color)}>
          {formatTime(timeLeft)}
        </div>
        <Progress value={progress} className="w-64 h-2" />
        <p className="text-sm text-muted-foreground">
          {mode === 'focus' ? '🍅 Mantenha o foco!' : '☕ Relaxe um pouco'}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => {
            if (timeLeft === 0) setTimeLeft(MODES[mode].duration)
            setIsRunning(!isRunning)
          }}
          size="lg"
          className="rounded-full px-8 gap-2"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button
          onClick={() => switchMode(mode)}
          size="lg"
          variant="outline"
          className="rounded-full px-6"
        >
          <RotateCcw size={20} />
        </Button>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Hábito em foco</label>
        <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Selecione um hábito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem hábito específico</SelectItem>
            {habits.map((h: any) => (
              <SelectItem key={h.id} value={h.id}>
                {h.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-muted-foreground">
          {mode === 'focus'
            ? `Sessão ${(completedSessions % 4) + 1} de 4`
            : completedSessions % 4 === 0
              ? 'Pausa Longa'
              : 'Pausa Curta'}
        </p>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                i < completedSessions % 4 ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {completedSessions} sessão(ões) concluída(s)
        </p>
      </div>
    </div>
  )
}
