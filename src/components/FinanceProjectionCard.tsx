import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, LineChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/currency'
import type { MonthlyProjection } from '@/lib/finance-projection'

const nextMonthLabel = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const money = formatBRL

export function FinanceProjectionCard({ projection }: { projection: MonthlyProjection }) {
  const { projectedIncome, projectedExpense, projectedBalance, monthsUsed, byCategory } = projection

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
          <LineChart size={20} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight capitalize">
            Projeção de {nextMonthLabel()}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {monthsUsed > 0
              ? `Calculada automaticamente pela média dos últimos ${monthsUsed} ${monthsUsed === 1 ? 'mês fechado' : 'meses fechados'}.`
              : 'Feche pelo menos um mês de transações para a projeção automática aparecer aqui.'}
          </p>
        </div>
      </div>

      {monthsUsed === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="p-10 flex flex-col items-center text-center gap-1">
            <p className="text-sm font-medium">Ainda sem histórico suficiente</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Registre transações ao longo do mês na aba Conta — assim que um mês fechar, a
              projeção é calculada automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <TrendingUp size={13} className="text-chart-4" /> Entradas previstas
                </div>
                <p className="data-num text-2xl font-bold text-chart-4">
                  + {money(projectedIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <TrendingDown size={13} className="text-destructive" /> Saídas previstas
                </div>
                <p className="data-num text-2xl font-bold text-destructive">
                  − {money(projectedExpense)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg border-primary/25 bg-accent/40 dark:bg-primary/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <Wallet size={13} className="text-primary" /> Saldo previsto
                </div>
                <p
                  className={cn(
                    'data-num text-2xl font-bold',
                    projectedBalance >= 0 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {projectedBalance >= 0 ? '+ ' : '− '}
                  {money(Math.abs(projectedBalance))}
                </p>
              </CardContent>
            </Card>
          </div>

          {byCategory.length > 0 && (
            <Card className="rounded-lg">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  Maiores gastos médios por categoria
                </p>
                <div className="flex flex-wrap gap-2">
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
