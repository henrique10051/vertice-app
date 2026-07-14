import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { HabitGrowthChart } from '@/components/dashboard/HabitGrowthChart'
import { FinancialGrowthChart } from '@/components/dashboard/FinancialGrowthChart'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import useGoalsStore from '@/stores/useGoalsStore'
import useHealthStore from '@/stores/useHealthStore'
import { WaterTrackerCard } from '@/components/dashboard/WaterTrackerCard'
import { CalorieTrackerCard } from '@/components/dashboard/CalorieTrackerCard'
import { FoodLoggerCard } from '@/components/dashboard/FoodLoggerCard'
import { calculateDailyCalories, calculateWaterGoal, type Gender } from '@/lib/health-utils'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  Flame,
  Target,
  Wallet,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const quotes = [
  'A disciplina é a ponte entre metas e realizações.',
  'Pequenos progressos todos os dias somam grandes resultados.',
  'Invista em você mesmo. É o melhor investimento que fará.',
]

export default function Index() {
  const { habits, toggleHabit } = useHabitsStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()
  const { healthLog, healthProfile, addWater, addCalories } = useHealthStore()

  const calorieGoal =
    healthProfile?.weight_kg && healthProfile?.height_cm && healthProfile?.age
      ? calculateDailyCalories(
          Number(healthProfile.weight_kg),
          Number(healthProfile.height_cm),
          Number(healthProfile.age),
          (healthProfile.gender as Gender) || 'male',
          (healthProfile.activity_level as any) || 'sedentary',
        )
      : 0
  const waterGoal = healthProfile?.weight_kg
    ? calculateWaterGoal(Number(healthProfile.weight_kg))
    : 2000

  const pendingHabits = habits.filter((h) => !h.is_completed).slice(0, 3)
  const completedToday = habits.filter((h) => h.is_completed).length
  const habitRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0

  const monthlyIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const monthlyExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)
  const balance = monthlyIncome - monthlyExpense
  const savingsRate = monthlyIncome > 0 ? Math.round((balance / monthlyIncome) * 100) : 0

  const mainGoal = goals[0]
  const goalProgress = mainGoal
    ? Math.round(
        (mainGoal.subtasks.filter((s) => s.completed).length / mainGoal.subtasks.length) * 100,
      )
    : 0
  const activeGoals = goals.filter((g) => g.status === 'Em Progresso').length

  const activityData = [
    { day: 'Seg', score: 30 },
    { day: 'Ter', score: 45 },
    { day: 'Qua', score: 35 },
    { day: 'Qui', score: 60 },
    { day: 'Sex', score: 55 },
    { day: 'Sáb', score: 80 },
    { day: 'Dom', score: 90 },
  ]

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const today = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero — the ascent of the day */}
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft">
        <div className="topo-lines absolute inset-0 opacity-70" />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {today}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">
              {greeting}.
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-md italic">
              {quotes[0]}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-5">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hábitos hoje
              </p>
              <p className="data-num text-4xl md:text-5xl font-bold text-primary leading-none mt-1">
                {habitRate}
                <span className="text-2xl align-top">%</span>
              </p>
              <p className="data-num text-xs text-muted-foreground mt-1">
                {completedToday}/{habits.length} concluídos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Taxa de Hábitos"
          value={`${habitRate}%`}
          hint={`${completedToday} de ${habits.length} hoje`}
          icon={Activity}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <MetricCard
          title="Saldo do Mês"
          value={`R$ ${balance.toLocaleString('pt-BR')}`}
          hint={balance >= 0 ? 'no positivo' : 'no vermelho'}
          icon={Wallet}
          iconColor="text-chart-4"
          iconBg="bg-chart-4/10"
        />
        <MetricCard
          title="Taxa de Poupança"
          value={`${savingsRate}%`}
          hint="da renda do mês"
          icon={TrendingUp}
          iconColor="text-chart-3"
          iconBg="bg-chart-3/10"
        />
        <MetricCard
          title="Objetivos Ativos"
          value={`${activeGoals}`}
          hint={mainGoal ? mainGoal.title : 'nenhum em progresso'}
          icon={Target}
          iconColor="text-chart-5"
          iconBg="bg-chart-5/10"
        />
      </div>

      {calorieGoal > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CalorieTrackerCard
            consumed={healthLog?.calories_consumed || 0}
            goal={calorieGoal}
            onAdd={addCalories}
          />
          <WaterTrackerCard
            current={healthLog?.water_intake_ml || 0}
            goal={waterGoal}
            onAdd={addWater}
          />
          <FoodLoggerCard onAddCalories={addCalories} />
        </div>
      ) : (
        <Link to="/saude">
          <Card className="rounded-lg p-6 flex items-center justify-between hover:shadow-elevation transition-shadow cursor-pointer">
            <div>
              <p className="font-bold text-lg">Configurar Perfil de Saúde</p>
              <p className="text-sm text-muted-foreground">Calcule suas metas de calorias e água</p>
            </div>
            <ArrowRight className="text-primary" />
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitGrowthChart />
        <FinancialGrowthChart />
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Atividade Semanal</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Flame className="text-secondary" /> Foco Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingHabits.length > 0 ? (
              pendingHabits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => toggleHabit(h.id)}
                >
                  <span className="font-medium text-sm">{h.title}</span>
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

        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="text-chart-4" /> Finanças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="data-num text-3xl font-bold mb-4 tracking-tight">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="data-num flex justify-between text-sm">
              <span className="text-chart-4 font-medium">↑ R$ {monthlyIncome}</span>
              <span className="text-destructive font-medium">↓ R$ {monthlyExpense}</span>
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

        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="text-chart-5" /> Objetivo
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
                  className="text-chart-5 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="data-num absolute text-2xl font-bold">{goalProgress}%</div>
            </div>
            <p className="mt-4 font-medium text-center text-sm">
              {mainGoal?.title || 'Nenhum objetivo'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
