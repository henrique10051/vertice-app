import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { useAgenda } from '@/hooks/use-agenda'
import { CustomTrackerEntryForm } from './trackers/CustomTrackerEntryForm'
import { Database } from 'lucide-react'

interface TrackerLogDialogProps {
  open: boolean
  setOpen: (v: boolean) => void
  taskId: string | null
  trackerId: string | null
  onSuccess?: () => void
}

export function TrackerLogDialog({
  open,
  setOpen,
  taskId,
  trackerId,
  onSuccess,
}: TrackerLogDialogProps) {
  const { customTrackers } = useCustomTrackersStore()
  const { updateTask } = useAgenda()

  const tracker = trackerId ? customTrackers[trackerId] : null

  if (!tracker) return null

  const handleSuccess = async () => {
    // Mark the task as completed in the database
    if (taskId) {
      await updateTask(taskId, { status: 'completed' })
    }
    onSuccess?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="text-primary w-5 h-5" />
            Preencher Rastreador: {tracker.name}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <CustomTrackerEntryForm
            tracker={tracker}
            taskId={taskId}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
