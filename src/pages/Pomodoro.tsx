import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePomodoroSettings, type PomodoroSettings } from '@/hooks/use-pomodoro-settings'
import { SettingsDialog } from '@/components/pomodoro/SettingsDialog'
import { StudyRoadmap } from '@/components/pomodoro/StudyRoadmap'
import { createPomodoroLog } from '@/services/pomodoro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Settings, Coffee, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimerMode = 'focus' | 'short-break' | 'long-break'

const modeConfig: Record<TimerMode, { label: string; color: string; icon: typeof Brain }> = {
  focus: { label: 'Foco', color: 'text-primary', icon: Brain },
  'short-break': { label: 'Pausa Curta', color: 'text-emerald-500', icon: Coffee },
  'long-break': { label: 'Pausa Longa', color: 'text-amber-500', icon: Coffee },
}

function getDuration(mode: TimerMode, s: PomodoroSettings): number {
  switch (mode) {
    case 'focus':
      return s.focusDuration * 60
    case 'short-break':
      return s.shortBreakDuration * 60
    case 'long-break':
      return s.longBreakDuration * 60
  }
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
    /* ignored */
  }
}

function notify(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/skip.png', tag: 'pomodoro' })
    } catch {
      /* ignored */
    }
  }
}

export default function Pomodoro() {
  const { user } = useAuth()
  const { settings, updateSettings } = usePomodoroSettings()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(settings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [focusCount, setFocusCount] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!isRunning) setSecondsLeft(getDuration(mode, settings))
  }, [settings, mode, isRunning])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return
    setIsRunning(false)
    playBeep()
    if (mode === 'focus') {
      notify('Sessão de Foco Concluída!', 'Hora de fazer uma pausa.')
      const newCount = focusCount + 1
      setFocusCount(newCount)
      if (user) void createPomodoroLog(user.id, settings.focusDuration)
      if (newCount % 4 === 0) {
        setMode('long-break')
        setSecondsLeft(settings.longBreakDuration * 60)
      } else {
        setMode('short-break')
        setSecondsLeft(settings.shortBreakDuration * 60)
      }
    } else {
      notify('Pausa Concluída!', 'Pronto para focar novamente?')
      setMode('focus')
      setSecondsLeft(settings.focusDuration * 60)
    }
  }, [secondsLeft, isRunning, mode, focusCount, settings, user])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setMode('focus')
    setSecondsLeft(settings.focusDuration * 60)
    setFocusCount(0)
  }, [settings])

  const totalSeconds = getDuration(mode, settings)
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const timeDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
  const circumference = 2 * Math.PI * 90
  const dashOffset = circumference * (1 - progress / 100)
  const currentConfig = modeConfig[mode]
  const Icon = currentConfig.icon
  const completedInCycle = focusCount % 4 === 0 && focusCount > 0 ? 4 : focusCount % 4

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pomodoro</h1>
          <p className="text-muted-foreground">Foque, descanse, repita.</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={20} />
        </Button>
      </div>

      <Card className="glass-card rounded-3xl border-none shadow-soft">
        <CardContent className="p-8 flex flex-col items-center">
          <div className={cn('flex items-center gap-2 mb-6 font-medium', currentConfig.color)}>
            <Icon size={20} />
            <span>{currentConfig.label}</span>
          </div>
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={cn('transition-all duration-1000 ease-linear', currentConfig.color)}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-bold tabular-nums">{timeDisplay}</span>
              <span className="text-sm text-muted-foreground mt-1">{currentConfig.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i < completedInCycle ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-8 gap-2"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={handleReset}
            >
              <RotateCcw size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {user && <StudyRoadmap userId={user.id} />}

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  )
}
