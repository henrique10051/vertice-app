import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomTrackerHistory } from './trackers/CustomTrackerHistory'
import { ClipboardList } from 'lucide-react'
import type { Habit } from '@/stores/useHabitsStore'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'

interface HabitHistoryDialogProps {
  open: boolean
  setOpen: (v: boolean) => void
  habit: Habit | null
}

export function HabitHistoryDialog({ open, setOpen, habit }: HabitHistoryDialogProps) {
  const { customTrackers } = useCustomTrackersStore()

  if (!habit) return null

  const tracker = customTrackers[habit.id]

  if (!tracker) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ClipboardList className="text-primary w-5 h-5" />
              Histórico: {habit.title}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-sm text-muted-foreground">
            Carregando histórico do hábito... Certifique-se de estar conectado.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ClipboardList className="text-primary w-5 h-5" />
            Histórico e Métricas: {habit.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <CustomTrackerHistory tracker={tracker} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
