import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Transaction } from '@/stores/useFinancesStore'
import { formatDatePT } from '@/lib/date-utils'
import { AddCard } from './AddCard'
import { DollarSign, Home, ShoppingCart, Car, BookOpen, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import useFinancesStore from '@/stores/useFinancesStore'

const categoryIcons: Record<string, any> = {
  Moradia: Home,
  Alimentação: ShoppingCart,
  Transporte: Car,
  'Educação/Crescimento': BookOpen,
  Renda: DollarSign,
}

export function TransactionsPanel({
  transactions,
  onAdd,
}: {
  transactions: Transaction[]
  onAdd: () => void
}) {
  const { deleteTransaction } = useFinancesStore()
  return (
    <Card className="glass-card rounded-3xl border-none shadow-soft lg:col-span-2">
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.slice(0, 10).map((t) => {
          const Icon = categoryIcons[t.category] || DollarSign
          const isIncome = t.type === 'income'
          return (
            <div
              key={t.id}
              className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    isIncome
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold">{t.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.category} • {formatDatePT(t.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'font-bold',
                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : '',
                  )}
                >
                  {isIncome ? '+' : '-'} R${' '}
                  {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  aria-label="Excluir transação"
                  className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
        <AddCard onClick={onAdd} className="min-h-[60px]" />
      </CardContent>
    </Card>
  )
}
