import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HabitForm, FinanceForm } from './forms/QuickAddForms'

export function QuickAddModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Adição Rápida</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="habit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 rounded-xl">
            <TabsTrigger value="habit" className="rounded-lg">
              Hábito
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-lg">
              Finanças
            </TabsTrigger>
          </TabsList>
          <TabsContent value="habit">
            <HabitForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="finance">
            <FinanceForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
