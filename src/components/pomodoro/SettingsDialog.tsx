import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PomodoroSettings } from '@/hooks/use-pomodoro-settings'

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: PomodoroSettings
  onSave: (settings: PomodoroSettings) => void
}) {
  const [focus, setFocus] = useState(settings.focusDuration)
  const [shortBreak, setShortBreak] = useState(settings.shortBreakDuration)
  const [longBreak, setLongBreak] = useState(settings.longBreakDuration)

  useEffect(() => {
    if (open) {
      setFocus(settings.focusDuration)
      setShortBreak(settings.shortBreakDuration)
      setLongBreak(settings.longBreakDuration)
    }
  }, [open, settings])

  const handleSave = () => {
    onSave({
      focusDuration: Math.max(1, focus),
      shortBreakDuration: Math.max(1, shortBreak),
      longBreakDuration: Math.max(1, longBreak),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações do Pomodoro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Duração do Foco (minutos)</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Pausa Curta (minutos)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={shortBreak}
              onChange={(e) => setShortBreak(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Pausa Longa (minutos)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={longBreak}
              onChange={(e) => setLongBreak(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
