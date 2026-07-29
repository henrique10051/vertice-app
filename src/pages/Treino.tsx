import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useWorkoutStore from '@/stores/useWorkoutStore'
import useHabitsStore from '@/stores/useHabitsStore'
import useGoalsStore from '@/stores/useGoalsStore'
import { WorkoutEvolutionChart } from '@/components/WorkoutEvolutionChart'
import { fetchWorkoutSuggestion } from '@/services/workout-suggestion'
import { WEEKDAYS } from '@/lib/workout-suggestion-fallback'
import { addDays, getTodayStr, strToDate } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { Dumbbell, Plus, Sparkles, Trash2, Loader2, CalendarClock, Check } from 'lucide-react'

export default function Treino() {
  const {
    exercises,
    sessions,
    sets,
    plan,
    addExercise,
    getOrCreateTodaySession,
    addSet,
    deleteSet,
    savePlan,
  } = useWorkoutStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()
  const { toast } = useToast()

  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState('')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [savingSet, setSavingSet] = useState(false)

  const [suggestion, setSuggestion] = useState<Awaited<
    ReturnType<typeof fetchWorkoutSuggestion>
  > | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)

  const today = getTodayStr()
  const todaySession = sessions.find((s) => s.date === today)
  const todaySets = todaySession ? sets.filter((s) => s.session_id === todaySession.id) : []

  const chartExerciseId = selectedExerciseId || exercises[0]?.id || ''
  const chartExercise = exercises.find((e) => e.id === chartExerciseId)

  const evolutionData = useMemo(() => {
    if (!chartExerciseId) return []
    const byDate = new Map<string, number>()
    sets
      .filter((s) => s.exercise_id === chartExerciseId)
      .forEach((s) => {
        const session = sessions.find((sess) => sess.id === s.session_id)
        if (!session) return
        const current = byDate.get(session.date) || 0
        byDate.set(session.date, Math.max(current, Number(s.weight_kg)))
      })
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, maxWeight]) => ({
        date,
        label: strToDate(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        maxWeight,
      }))
  }, [sets, sessions, chartExerciseId])

  const handleAddSet = async () => {
    if (!selectedExerciseId || !reps || !weight) return
    setSavingSet(true)
    const session = await getOrCreateTodaySession()
    if (session) {
      await addSet(
        session.id,
        selectedExerciseId,
        Number(reps),
        Number(weight),
        rpe ? Number(rpe) : undefined,
      )
      setReps('')
      setWeight('')
      setRpe('')
      toast({ title: 'Série registrada!' })
    }
    setSavingSet(false)
  }

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) return
    const created = await addExercise(newExerciseName.trim())
    if (created) {
      setSelectedExerciseId(created.id)
      setNewExerciseName('')
    }
  }

  const last7Days = addDays(today, -7)
  const muscleGroupsTrained = useMemo(() => {
    const groups = new Set<string>()
    sets.forEach((s) => {
      const session = sessions.find((sess) => sess.id === s.session_id)
      if (!session || session.date < last7Days) return
      const ex = exercises.find((e) => e.id === s.exercise_id)
      if (ex?.muscle_group) groups.add(ex.muscle_group)
    })
    return [...groups]
  }, [sets, sessions, exercises, last7Days])

  const habitConsistencyRate =
    habits.length > 0
      ? Math.round((habits.filter((h) => h.is_completed).length / habits.length) * 100)
      : 0

  const handleGenerateSuggestion = async () => {
    setLoadingSuggestion(true)
    setSuggestion(null)
    const recentSets = sets
      .filter((s) => {
        const session = sessions.find((sess) => sess.id === s.session_id)
        return session && session.date >= last7Days
      })
      .map((s) => {
        const ex = exercises.find((e) => e.id === s.exercise_id)
        const session = sessions.find((sess) => sess.id === s.session_id)
        return {
          exerciseName: ex?.name || 'Exercício',
          weightKg: Number(s.weight_kg),
          reps: s.reps,
          date: session?.date || today,
        }
      })

    const result = await fetchWorkoutSuggestion({
      recentSets,
      muscleGroupsTrained,
      activeGoals: goals.filter((g) => g.status === 'Em Progresso').map((g) => g.title),
      habitConsistencyRate,
    })
    setSuggestion(result)
    setLoadingSuggestion(false)
  }

  const sortByWeekday = <T extends { dayOfWeek: string }>(items: T[]) =>
    [...items].sort(
      (a, b) =>
        (WEEKDAYS as readonly string[]).indexOf(a.dayOfWeek) -
        (WEEKDAYS as readonly string[]).indexOf(b.dayOfWeek),
    )

  const handleSavePlan = async () => {
    if (!suggestion) return
    setSavingPlan(true)
    await savePlan({ summary: suggestion.summary, items: suggestion.habits })
    setSuggestion(null)
    setSavingPlan(false)
    toast({ title: 'Cronograma salvo!' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Dumbbell className="text-primary" size={28} />
          Treino
        </h1>
        <p className="text-muted-foreground">Registre suas cargas e acompanhe sua progressão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Registrar Série</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exercício</Label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Novo exercício"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddExercise} className="gap-1">
                  <Plus size={14} /> Criar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Reps</Label>
                <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>RPE (opcional)</Label>
                <Input
                  type="number"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <Button
              onClick={handleAddSet}
              disabled={!selectedExerciseId || !reps || !weight || savingSet}
              className="w-full gap-2"
            >
              {savingSet ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar Série
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Sessão de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySets.length > 0 ? (
              todaySets.map((s) => {
                const ex = exercises.find((e) => e.id === s.exercise_id)
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <span className="font-medium text-sm">{ex?.name || 'Exercício'}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        série {s.set_number} — {s.reps} reps × {s.weight_kg}kg
                        {s.rpe ? ` — RPE ${s.rpe}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSet(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma série registrada hoje.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-3">
          <div className="max-w-xs">
            <Select value={chartExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o exercício do gráfico" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <WorkoutEvolutionChart exerciseName={chartExercise?.name || ''} data={evolutionData} />
        </div>
      )}

      {plan && (
        <Card className="glass-card rounded-2xl border-none shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarClock className="text-primary" size={20} />
              Cronograma de Treino
            </CardTitle>
            <p className="text-sm text-muted-foreground italic">{plan.summary}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortByWeekday(plan.items).map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="shrink-0 w-20 text-xs font-semibold uppercase tracking-wide text-primary pt-0.5">
                  {item.dayOfWeek}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass-card rounded-2xl border-none shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Sugestão de Treino com IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Baseado no seu histórico de cargas, grupos musculares recentes e objetivos.
            {plan ? ' Gerar uma nova sugestão substitui o cronograma atual.' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateSuggestion} disabled={loadingSuggestion} className="gap-2">
            {loadingSuggestion ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Gerar Sugestão
          </Button>

          {suggestion && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground italic">{suggestion.summary}</p>
              {sortByWeekday(suggestion.habits).map((h, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="shrink-0 w-20 text-xs font-semibold uppercase tracking-wide text-primary pt-0.5">
                    {h.dayOfWeek}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{h.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{h.description}</p>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSavePlan}
                disabled={savingPlan}
                variant="outline"
                className="gap-2"
              >
                {savingPlan ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Salvar como Cronograma
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
