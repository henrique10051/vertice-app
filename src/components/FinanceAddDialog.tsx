import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FinanceForm } from './forms/QuickAddForms'
import type { Transaction } from '@/stores/useFinancesStore'

export function FinanceAddDialog({
  open,
  setOpen,
  transaction,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  transaction?: Transaction
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        <FinanceForm
          key={transaction?.id || 'new'}
          onSuccess={() => setOpen(false)}
          transaction={transaction}
        />
      </DialogContent>
    </Dialog>
  )
}
