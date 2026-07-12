import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AgendaTaskDialog } from '@/components/AgendaTaskDialog'
import { useAgenda } from '@/hooks/use-agenda'
import { Plus, ArrowLeft, CalendarDays, Clock, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { format, isSameDay, isSameMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AgendaTask } from '@/services/agenda'

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: AgendaTask
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const isCompleted = task.status === 'completed'
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50',
        isCompleted && 'opacity-60',
      )}
    >
      <Checkbox checked={isCompleted} onCheckedChange={() => onToggle(task.id, task.status)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isCompleted && 'line-through')}>{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock size={12} /> {format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm")}
        </p>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground hover:text-rose-500 p-1 shrink-0"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="glass-card rounded-2xl border-none">
      <CardContent className="p-12 text-center">
        <CalendarDays className="mx-auto text-muted-foreground mb-3" size={40} />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

export default function AgendaPage() {
  const { tasks, loading, toggleTask, removeTask } = useAgenda()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const todayTasks = useMemo(
    () => tasks.filter((t) => isSameDay(new Date(t.due_date), new Date())),
    [tasks],
  )

  const weekTasks = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 })
    const end = endOfWeek(new Date(), { weekStartsOn: 0 })
    return tasks.filter((t) => isWithinInterval(new Date(t.due_date), { start, end }))
  }, [tasks])

  const monthTasks = useMemo(
    () => tasks.filter((t) => isSameMonth(new Date(t.due_date), new Date())),
    [tasks],
  )

  const selectedDateTasks = useMemo(
    () => tasks.filter((t) => selectedDate && isSameDay(new Date(t.due_date), selectedDate)),
    [tasks, selectedDate],
  )

  const datesWithTasks = monthTasks.map((t) => new Date(t.due_date))

  const groupedWeek = useMemo(() => {
    const groups: Record<string, AgendaTask[]> = {}
    weekTasks.forEach((t) => {
      const key = format(new Date(t.due_date), 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [weekTasks])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CalendarDays className="text-primary" size={28} />
            </div>
            Agenda
          </h1>
          <p className="text-muted-foreground">
            Organize suas tarefas diárias, semanais e mensais.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2">
          <Plus size={18} /> Nova Tarefa
        </Button>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : todayTasks.length === 0 ? (
            <EmptyState message="Nenhuma tarefa para hoje." />
          ) : (
            <Card className="glass-card rounded-2xl border-none">
              <CardContent className="p-2 space-y-1">
                {todayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={removeTask} />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : weekTasks.length === 0 ? (
            <EmptyState message="Nenhuma tarefa para esta semana." />
          ) : (
            groupedWeek.map(([dateStr, dayTasks]) => (
              <div key={dateStr} className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground px-1">
                  {format(new Date(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <Card className="glass-card rounded-2xl border-none">
                  <CardContent className="p-2 space-y-1">
                    {dayTasks.map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={removeTask} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="month" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <>
              <Card className="glass-card rounded-2xl border-none">
                <CardContent className="p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => setSelectedDate(d)}
                    locale={ptBR}
                    modifiers={{ hasTask: datesWithTasks }}
                    modifiersClassNames={{ hasTask: 'day-has-task' }}
                    className="border-none"
                  />
                </CardContent>
              </Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Badge variant="secondary" className="rounded-lg">
                    {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedDateTasks.length} tarefa(s)
                  </span>
                </div>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1 py-4">
                    Nenhuma tarefa nesta data.
                  </p>
                ) : (
                  <Card className="glass-card rounded-2xl border-none">
                    <CardContent className="p-2 space-y-1">
                      {selectedDateTasks.map((t) => (
                        <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={removeTask} />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <AgendaTaskDialog open={dialogOpen} setOpen={setDialogOpen} />
    </div>
  )
}
