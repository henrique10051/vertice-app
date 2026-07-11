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
        <Card className="glass-card rounded-3xl border-none shadow-soft bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted-foreground font-medium">Saldo Atual</span>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                <Wallet className="text-primary" size={20} />
              </div>
            </div>
            <div className="text-4xl font-bold tracking-tighter">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-3xl border-none shadow-soft">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted-foreground font-medium">Entradas</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-xl">
                <TrendingUp className="text-emerald-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tighter text-emerald-600 dark:text-emerald-400">
              R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-3xl border-none shadow-soft">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-muted-foreground font-medium">Saídas</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950 rounded-xl">
                <TrendingDown className="text-rose-500" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tighter text-rose-600 dark:text-rose-400">
              R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TransactionsPanel transactions={transactions} onAdd={() => setAddOpen(true)} />

        <Card className="glass-card rounded-3xl border-none shadow-soft">
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
                  <span className="text-muted-foreground">
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
