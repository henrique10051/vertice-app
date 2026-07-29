import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAgenda } from '@/hooks/use-agenda'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { TrackerLogDialog } from '@/components/TrackerLogDialog'
import { useToast } from '@/hooks/use-toast'
import { getTodayStr, addDays, formatDateLongPT } from '@/lib/date-utils'
import {
  Sun,
  CloudSun,
  Moon,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Briefcase,
  User,
  Heart,
  DollarSign,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgendaCategory, AgendaTask } from '@/services/agenda'
import type { CustomTracker, CustomTrackerEntry } from '@/services/custom-trackers-schema'

const CATEGORY_DETAILS: Record<
  AgendaCategory,
  { label: string; bg: string; text: string; icon: any }
> = {
  pessoal: {
    label: 'Pessoal',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-700 dark:text-violet-300',
    icon: User,
  },
  trabalho: {
    label: 'Trabalho',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Briefcase,
  },
  saude: {
    label: 'Saúde',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Heart,
  },
  financas: {
    label: 'Finanças',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    icon: DollarSign,
  },
  outro: {
    label: 'Outro',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    icon: HelpCircle,
  },
}

export default function Rotinas() {
  const { tasks, addTask, updateTask, removeTask, toggleTask } = useAgenda()
  const { customTrackers, trackerEntries } = useCustomTrackersStore()
  const trackers = Object.values(customTrackers)
  const logs = Object.values(trackerEntries).flat()
  const { toast } = useToast()

  const today = getTodayStr()
  const [selectedDate, setSelectedDate] = useState(today)

  // Dialog management
  const [isOpen, setIsOpen] = useState(false)
  const [targetPeriod, setTargetPeriod] = useState<'morning' | 'afternoon' | 'night'>('morning')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AgendaCategory>('pessoal')
  const [trackerId, setTrackerId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Tracker Log Dialog state
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [activeLogTaskId, setActiveLogTaskId] = useState<string | null>(null)
  const [activeLogTrackerId, setActiveLogTrackerId] = useState<string | null>(null)

  const handleToggleTask = (task: AgendaTask) => {
    if (task.tracker_id && task.status === 'pending') {
      setActiveLogTaskId(task.id)
      setActiveLogTrackerId(task.tracker_id)
      setLogDialogOpen(true)
    } else {
      toggleTask(task.id, task.status)
    }
  }

  // Filter tasks for the selected date
  const dateTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date.split('T')[0] === selectedDate)
  }, [tasks, selectedDate])

  // Split tasks by period
  const morningTasks = useMemo(
    () => dateTasks.filter((t) => t.routine_period === 'morning'),
    [dateTasks],
  )
  const afternoonTasks = useMemo(
    () => dateTasks.filter((t) => t.routine_period === 'afternoon'),
    [dateTasks],
  )
  const nightTasks = useMemo(
    () => dateTasks.filter((t) => t.routine_period === 'night'),
    [dateTasks],
  )
  const unassignedTasks = useMemo(() => dateTasks.filter((t) => !t.routine_period), [dateTasks])

  // Stats calculation
  const totalRoutineTasks = morningTasks.length + afternoonTasks.length + nightTasks.length
  const completedRoutineTasks = [...morningTasks, ...afternoonTasks, ...nightTasks].filter(
    (t) => t.status === 'completed',
  ).length

  const completionPercent =
    totalRoutineTasks > 0 ? Math.round((completedRoutineTasks / totalRoutineTasks) * 100) : 0

  const handleOpenAddDialog = (period: 'morning' | 'afternoon' | 'night') => {
    setTargetPeriod(period)
    setTitle('')
    setDescription('')
    setCategory('pessoal')
    setTrackerId('')
    setIsOpen(true)
  }

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, dê um nome para sua tarefa de rotina.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: new Date(selectedDate).toISOString(),
        category,
        routine_period: targetPeriod,
        tracker_id: trackerId || null,
      })

      if (error) {
        toast({
          title: 'Erro ao criar',
          description: error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Tarefa adicionada!',
          description: `Nova tarefa adicionada à sua rotina da ${
            targetPeriod === 'morning' ? 'Manhã' : targetPeriod === 'afternoon' ? 'Tarde' : 'Noite'
          }.`,
        })
        setIsOpen(false)
      }
    } catch {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao salvar a tarefa de rotina.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAssignPeriod = async (taskId: string, period: 'morning' | 'afternoon' | 'night') => {
    try {
      await updateTask(taskId, { routine_period: period })
      toast({
        title: 'Tarefa categorizada',
        description: `Tarefa movida para o período selecionado.`,
      })
    } catch {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível mover a tarefa.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Rotina Diária
            </p>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            Controle de Rotina <Sparkles className="text-primary w-6 h-6 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e organize o que fazer em cada período do seu dia.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-card border border-border/70 rounded-full p-1.5 shadow-soft shrink-0 self-start md:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-xs font-semibold px-4 min-w-[150px] text-center capitalize">
            {selectedDate === today ? 'Hoje' : formatDateLongPT(selectedDate)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      {totalRoutineTasks > 0 && (
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Progresso do dia</p>
            <h3 className="font-bold text-lg">
              {completedRoutineTasks} de {totalRoutineTasks} tarefas de rotina concluídas
            </h3>
            <p className="text-xs text-muted-foreground">
              Continue focado para manter sua rotina 100% sob controle!
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-full md:w-60 bg-muted h-3 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="font-bold text-sm min-w-[35px] text-right">{completionPercent}%</span>
          </div>
        </div>
      )}

      {/* Routine Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Morning Block */}
        <div className="bg-card border border-border/70 rounded-xl shadow-soft overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-border/50 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Manhã</h3>
                <p className="text-[10px] text-muted-foreground">Atividades matinais</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {morningTasks.filter((t) => t.status === 'completed').length}/{morningTasks.length}
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
            {morningTasks.length > 0 ? (
              morningTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task)}
                  onDelete={() => removeTask(task.id)}
                  trackers={trackers}
                  logs={logs}
                />
              ))
            ) : (
              <EmptyBlockState text="Sem tarefas agendadas para a manhã." />
            )}
          </div>

          <div className="p-4 border-t border-border/40">
            <Button
              onClick={() => handleOpenAddDialog('morning')}
              className="w-full bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:text-amber-800 border-none flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus size={16} /> Adicionar à Manhã
            </Button>
          </div>
        </div>

        {/* Afternoon Block */}
        <div className="bg-card border border-border/70 rounded-xl shadow-soft overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-border/50 bg-sky-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <CloudSun size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Tarde</h3>
                <p className="text-[10px] text-muted-foreground">Foco e produtividade</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
              {afternoonTasks.filter((t) => t.status === 'completed').length}/
              {afternoonTasks.length}
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
            {afternoonTasks.length > 0 ? (
              afternoonTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task)}
                  onDelete={() => removeTask(task.id)}
                  trackers={trackers}
                  logs={logs}
                />
              ))
            ) : (
              <EmptyBlockState text="Sem tarefas agendadas para a tarde." />
            )}
          </div>

          <div className="p-4 border-t border-border/40">
            <Button
              onClick={() => handleOpenAddDialog('afternoon')}
              className="w-full bg-sky-500/10 hover:bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:text-sky-800 border-none flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus size={16} /> Adicionar à Tarde
            </Button>
          </div>
        </div>

        {/* Night Block */}
        <div className="bg-card border border-border/70 rounded-xl shadow-soft overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-border/50 bg-indigo-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Moon size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Noite</h3>
                <p className="text-[10px] text-muted-foreground">Relaxamento e reflexão</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {nightTasks.filter((t) => t.status === 'completed').length}/{nightTasks.length}
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
            {nightTasks.length > 0 ? (
              nightTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleTask(task)}
                  onDelete={() => removeTask(task.id)}
                  trackers={trackers}
                  logs={logs}
                />
              ))
            ) : (
              <EmptyBlockState text="Sem tarefas agendadas para a noite." />
            )}
          </div>

          <div className="p-4 border-t border-border/40">
            <Button
              onClick={() => handleOpenAddDialog('night')}
              className="w-full bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 border-none flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus size={16} /> Adicionar à Noite
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible Unassigned Tasks */}
      {unassignedTasks.length > 0 && (
        <div className="bg-card border border-border/70 rounded-xl p-5 shadow-soft space-y-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              Tarefas do Dia sem Período Definido
            </h3>
            <p className="text-xs text-muted-foreground">
              Você criou essas tarefas na Agenda. Organize-as na sua rotina escolhendo um período
              abaixo:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedTasks.map((task) => {
              const cat = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS.outro
              const CatIcon = cat.icon
              return (
                <div
                  key={task.id}
                  className="border border-border/70 rounded-xl p-4 bg-muted/30 flex flex-col justify-between gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          cat.bg,
                          cat.text,
                        )}
                      >
                        <CatIcon size={10} />
                        {cat.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Organizar em:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-amber-500/10 hover:text-amber-500 rounded-full"
                        title="Mover para Manhã"
                        onClick={() => handleAssignPeriod(task.id, 'morning')}
                      >
                        <Sun size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-sky-500/10 hover:text-sky-500 rounded-full"
                        title="Mover para Tarde"
                        onClick={() => handleAssignPeriod(task.id, 'afternoon')}
                      >
                        <CloudSun size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:bg-indigo-500/10 hover:text-indigo-500 rounded-full"
                        title="Mover para Noite"
                        onClick={() => handleAssignPeriod(task.id, 'night')}
                      >
                        <Moon size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Adicionar à Rotina da{' '}
              {targetPeriod === 'morning'
                ? 'Manhã'
                : targetPeriod === 'afternoon'
                  ? 'Tarde'
                  : 'Noite'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Nome da Tarefa *</Label>
              <Input
                id="task-name"
                placeholder="Ex: Meditação, Estudar Inglês, Limpar mesa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc">Descrição / Detalhes</Label>
              <Textarea
                id="task-desc"
                placeholder="Detalhes sobre a atividade..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AgendaCategory)}>
                <SelectTrigger id="task-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                  <SelectItem value="trabalho">Trabalho</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="financas">Finanças</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-tracker">Rastreador Customizado (Opcional)</Label>
              <Select
                value={trackerId || '_none'}
                onValueChange={(v) => setTrackerId(v === '_none' ? '' : v)}
              >
                <SelectTrigger id="task-tracker">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {trackers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={saving}>
              {saving ? 'Adicionando...' : 'Adicionar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TrackerLogDialog
        open={logDialogOpen}
        setOpen={setLogDialogOpen}
        taskId={activeLogTaskId}
        trackerId={activeLogTrackerId}
      />
    </div>
  )
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  trackers = [],
  logs = [],
}: {
  task: AgendaTask
  onToggle: () => void
  onDelete: () => void
  trackers?: CustomTracker[]
  logs?: CustomTrackerEntry[]
}) {
  const isCompleted = task.status === 'completed'
  const cat = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS.outro
  const CatIcon = cat.icon

  const associatedTracker = trackers.find((t) => t.id === task.tracker_id)
  const associatedLog = logs.find((l) => l.task_id === task.id)

  return (
    <div
      className={cn(
        'group flex items-start justify-between gap-3 p-3 rounded-xl border border-border/70 transition-all duration-200 shadow-sm hover:shadow bg-background',
        isCompleted && 'bg-muted/40 border-muted/50',
      )}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <button
          onClick={onToggle}
          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0 focus:outline-none"
        >
          {isCompleted ? (
            <CheckCircle2 size={19} className="text-primary fill-primary/10" />
          ) : (
            <Circle size={19} className="hover:scale-105 transition-transform" />
          )}
        </button>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                cat.bg,
                cat.text,
              )}
            >
              <CatIcon size={9} />
              {cat.label}
            </span>
          </div>

          <h4
            className={cn(
              'font-semibold text-sm leading-snug text-foreground break-words transition-all duration-200',
              isCompleted && 'line-through text-muted-foreground font-normal',
            )}
          >
            {task.title}
          </h4>

          {task.description && (
            <p
              className={cn(
                'text-xs text-muted-foreground leading-relaxed break-words',
                isCompleted && 'text-muted-foreground/60',
              )}
            >
              {task.description}
            </p>
          )}

          {/* Associated Custom Tracker Badge Info */}
          {associatedTracker && !isCompleted && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="font-semibold text-primary/70">Requer rastreador:</span>
              <span className="bg-primary/5 px-1.5 py-0.5 rounded font-medium text-primary/80 border border-primary/10">
                {associatedTracker.name}
              </span>
            </div>
          )}

          {associatedTracker && isCompleted && associatedLog && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(associatedLog.values).map(([key, val]) => {
                const field = associatedTracker.validation.find((f) => f.name === key)
                if (field?.type === 'object[]') return null // Don't render full table in a tiny card badge
                return (
                  <span
                    key={key}
                    className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 font-medium"
                  >
                    <strong>{field?.label || key}:</strong>{' '}
                    {typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : String(val)}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 self-center"
        title="Excluir tarefa de rotina"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function EmptyBlockState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10 h-full min-h-[180px]">
      <p className="text-xs text-muted-foreground italic">{text}</p>
    </div>
  )
}
