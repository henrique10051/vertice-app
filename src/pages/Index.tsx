import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import useGoalsStore from '@/stores/useGoalsStore'
import { getTodayStr } from '@/lib/date-utils'
import { CheckCircle2, Circle, Flame, Target } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const quotes = [
  'A disciplina é a ponte entre metas e realizações.',
  'Pequenos progressos todos os dias somam grandes resultados.',
  'Invista em você mesmo. É o melhor investimento que fará.',
]

export default function Index() {
  const today = getTodayStr()
  const { habits, toggleHabit } = useHabitsStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()

  const pendingHabits = habits.filter((h) => !h.history.includes(today)).slice(0, 3)

  const monthlyIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const monthlyExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)
  const balance = monthlyIncome - monthlyExpense

  const mainGoal = goals[0]
  const goalProgress = mainGoal
    ? Math.round(
        (mainGoal.subtasks.filter((s) => s.completed).length / mainGoal.subtasks.length) * 100,
      )
    : 0

  const activityData = [
    { day: 'Seg', score: 30 },
    { day: 'Ter', score: 45 },
    { day: 'Qua', score: 35 },
    { day: 'Qui', score: 60 },
    { day: 'Sex', score: 55 },
    { day: 'Sáb', score: 80 },
    { day: 'Dom', score: 90 },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-primary/10 text-primary p-4 rounded-2xl flex items-center gap-4">
        <span className="text-xl">✨</span>
        <p className="font-medium italic text-sm md:text-base">{quotes[0]}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card rounded-2xl border-none shadow-soft hover:shadow-elevation transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Flame className="text-orange-500" /> Foco Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingHabits.length > 0 ? (
              pendingHabits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => toggleHabit(h.id, today)}
                >
                  <span className="font-medium text-sm">{h.name}</span>
                  <Circle
                    size={20}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
                <CheckCircle2 size={32} className="text-primary mb-2 opacity-50" />
                <p>Todos os hábitos concluídos!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border-none shadow-soft hover:shadow-elevation transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="text-emerald-500" /> Finanças do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 tracking-tight">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-500 font-medium">↑ R$ {monthlyIncome}</span>
              <span className="text-rose-500 font-medium">↓ R$ {monthlyExpense}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{
                  width: `${Math.min((monthlyExpense / (monthlyIncome || 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border-none shadow-soft hover:shadow-elevation transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="text-indigo-500" /> Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-muted"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={301.59}
                  strokeDashoffset={301.59 - (goalProgress / 100) * 301.59}
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-2xl font-bold">{goalProgress}%</div>
            </div>
            <p className="mt-4 font-medium text-center text-sm">
              {mainGoal?.title || 'Nenhum objetivo'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card rounded-2xl border-none shadow-soft">
        <CardHeader>
          <CardTitle>Atividade Semanal</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ChartContainer
            config={{ score: { label: 'Produtividade', color: 'hsl(var(--primary))' } }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
