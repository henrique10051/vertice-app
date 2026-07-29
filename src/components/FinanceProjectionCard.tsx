import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, LineChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MonthlyProjection } from '@/lib/finance-projection'

const nextMonthLabel = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const money = (n: number) =>
  `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export function FinanceProjectionCard({ projection }: { projection: MonthlyProjection }) {
  const { projectedIncome, projectedExpense, projectedBalance, monthsUsed, byCategory } = projection

  return (
    <Card className="rounded-lg border-primary/25 bg-accent/40 dark:bg-primary/10">
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex items-start gap-3 lg:w-56 shrink-0">
            <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
              <LineChart size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight capitalize">
                Projeção de {nextMonthLabel()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {monthsUsed > 0
                  ? `Média dos últimos ${monthsUsed} ${monthsUsed === 1 ? 'mês fechado' : 'meses fechados'}`
                  : 'Feche pelo menos um mês para ver a projeção'}
              </p>
            </div>
          </div>

          {monthsUsed > 0 && (
            <div className="flex-1 grid grid-cols-3 divide-x divide-primary/15">
              <div className="pr-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  <TrendingUp size={13} className="text-chart-4" /> Entradas
                </div>
                <p className="data-num text-base sm:text-lg font-bold text-chart-4">
                  {money(projectedIncome)}
                </p>
              </div>
              <div className="px-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  <TrendingDown size={13} className="text-destructive" /> Saídas
                </div>
                <p className="data-num text-base sm:text-lg font-bold text-destructive">
                  {money(projectedExpense)}
                </p>
              </div>
              <div className="pl-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                  <Wallet size={13} className="text-primary" /> Saldo
                </div>
                <p
                  className={cn(
                    'data-num text-base sm:text-lg font-bold',
                    projectedBalance >= 0 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {money(projectedBalance)}
                </p>
              </div>
            </div>
          )}
        </div>

        {byCategory.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/15">
            {byCategory.slice(0, 5).map((c) => (
              <span
                key={c.category}
                className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5"
              >
                <span className="font-medium">{c.category}</span>
                <span className="data-num text-muted-foreground">{money(c.avg)}</span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
