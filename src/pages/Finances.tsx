import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useFinancesStore from '@/stores/useFinancesStore'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { TransactionsPanel } from '@/components/TransactionsPanel'
import { FinanceAddDialog } from '@/components/FinanceAddDialog'

const COLORS = [
  'hsl(var(--chart-4))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--primary))',
]

export default function Finances() {
  const { transactions } = useFinancesStore()
  const [addOpen, setAddOpen] = useState(false)

  const { income, expense, balance, expensesByCategory } = useMemo(() => {
    let inc = 0,
      exp = 0
    const catMap: Record<string, number> = {}
    transactions.forEach((t) => {
      if (t.type === 'income') {
        inc += t.amount
      } else {
        exp += t.amount
        catMap[t.category] = (catMap[t.category] || 0) + t.amount
      }
    })
    const chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
    return { income: inc, expense: exp, balance: inc - exp, expensesByCategory: chartData }
  }, [transactions])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Organização Financeira</h1>
        <p className="text-muted-foreground">Acompanhe seus gastos e invista no seu crescimento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground border-none shadow-elevation">
          <div className="topo-lines absolute inset-0 opacity-40" />
          <CardContent className="relative p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-primary-foreground/80 uppercase text-xs tracking-wide">
                Saldo Atual
              </span>
              <div className="p-2 bg-white/15 rounded-lg">
                <Wallet size={20} />
              </div>
            </div>
            <div className="data-num text-4xl font-bold tracking-tight">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted-foreground font-medium uppercase text-xs tracking-wide">
                Entradas
              </span>
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <TrendingUp className="text-chart-4" size={20} />
              </div>
            </div>
            <div className="data-num text-3xl font-bold tracking-tight text-chart-4">
              R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted-foreground font-medium uppercase text-xs tracking-wide">
                Saídas
              </span>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="text-destructive" size={20} />
              </div>
            </div>
            <div className="data-num text-3xl font-bold tracking-tight text-destructive">
              R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TransactionsPanel transactions={transactions} onAdd={() => setAddOpen(true)} />

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {expensesByCategory.length > 0 ? (
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada.
              </div>
            )}
            <div className="w-full space-y-2 mt-4">
              {expensesByCategory.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="data-num text-muted-foreground">
                    {Math.round((entry.value / expense) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <FinanceAddDialog open={addOpen} setOpen={setAddOpen} />
    </div>
  )
}
