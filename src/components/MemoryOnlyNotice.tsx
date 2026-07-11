import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function MemoryOnlyNotice() {
  return (
    <Alert className="border-amber-500/30 bg-amber-500/5 rounded-2xl">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
        Os dados ficam salvos apenas em memória e serão perdidos ao recarregar a página até que um
        banco de dados seja conectado.
      </AlertDescription>
    </Alert>
  )
}
