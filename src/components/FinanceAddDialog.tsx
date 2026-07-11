import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FinanceForm } from './forms/QuickAddForms'

export function FinanceAddDialog({
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
          <DialogTitle className="text-xl">Nova Transação</DialogTitle>
        </DialogHeader>
        <FinanceForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
