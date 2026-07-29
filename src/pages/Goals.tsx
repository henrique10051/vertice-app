import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import useGoalsStore, { type Goal } from '@/stores/useGoalsStore'
import { Target, Calendar, CheckCircle2, Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDatePT } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { GoalFormDialog } from '@/components/GoalFormDialog'

export default function Goals() {
  const { goals, toggleSubtask, deleteGoal } = useGoalsStore()
  const [filter, setFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined)

  const openCreate = () => {
    setEditingGoal(undefined)
    setFormOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  const filteredGoals = goals.filter(
    (g) =>
      filter === 'all' ||
      (filter === 'active' && g.status === 'Em Progresso') ||
      (filter === 'completed' && g.status === 'Concluído'),
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Acompanhamento de Objetivos</h1>
          <p className="text-muted-foreground">Divida grandes sonhos em passos executáveis.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus size={16} /> Novo Objetivo
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="bg-muted/60 backdrop-blur-md rounded-xl p-1 mb-6">
          <TabsTrigger value="all" className="rounded-lg">
            Todos
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">
            Em Progresso
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">
            Concluídos
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map((goal) => {
            const completed = goal.subtasks.filter((s) => s.completed).length
            const total = goal.subtasks.length
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
            const isDone = goal.status === 'Concluído'

            return (
              <Card
                key={goal.id}
                className={cn(
                  'glass-card rounded-3xl border-none shadow-soft transition-all duration-300 hover:shadow-elevation overflow-hidden relative',
                  isDone && 'bg-primary/5 dark:bg-primary/10',
                )}
              >
                <div className="absolute top-0 right-0 p-4 flex items-center gap-1">
                  {isDone && <CheckCircle2 className="text-primary mr-1" size={24} />}
                  <button
                    onClick={() => openEdit(goal)}
                    aria-label="Editar objetivo"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    aria-label="Excluir objetivo"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2 text-indigo-500">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Target size={24} />
                    </div>
                    <span className="text-sm font-semibold tracking-wider uppercase">Meta</span>
                  </div>
                  <CardTitle className="text-xl leading-tight">{goal.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar size={16} />
                    Alvo: {formatDatePT(goal.targetDate)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Progresso</span>
                      <span className={cn(isDone ? 'text-primary' : 'text-foreground')}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          isDone ? 'bg-primary' : 'bg-indigo-500',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Passos
                    </h4>
                    {goal.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-start gap-3 p-2 hover:bg-muted/40 rounded-lg transition-colors"
                      >
                        <Checkbox
                          checked={sub.completed}
                          onCheckedChange={() => toggleSubtask(goal.id, sub.id)}
                          className="mt-1 rounded border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span
                          className={cn(
                            'text-sm font-medium leading-snug transition-all',
                            sub.completed && 'line-through text-muted-foreground',
                          )}
                        >
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Tabs>

      <GoalFormDialog open={formOpen} setOpen={setFormOpen} goal={editingGoal} />
    </div>
  )
}
