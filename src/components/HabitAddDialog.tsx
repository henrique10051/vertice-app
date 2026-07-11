import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HabitForm } from './forms/QuickAddForms'

export function HabitAddDialog({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Hábito</DialogTitle>
        </DialogHeader>
        <HabitForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
