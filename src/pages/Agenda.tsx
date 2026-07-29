import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import {
  AgendaTaskDialog,
  AGENDA_CATEGORIES,
  DURATION_OPTIONS,
} from '@/components/AgendaTaskDialog'
import { useAgenda } from '@/hooks/use-agenda'
import useHabitsStore from '@/stores/useHabitsStore'
import { dateToStr } from '@/lib/date-utils'
import {
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Repeat,
  Loader2,
  Save,
  Sun,
  CloudSun,
  Moon,
  CheckCircle2,
  Circle,
  Clock,
  Briefcase,
  User,
  Heart,
  DollarSign,
  HelpCircle,
} from 'lucide-react'
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays as addDaysFns,
  addWeeks,
  addMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AgendaCategory, AgendaTask } from '@/services/agenda'
import type { Habit } from '@/stores/useHabitsStore'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { TrackerLogDialog } from '@/components/TrackerLogDialog'
import { useAuth } from '@/hooks/use-auth'

type EntryCategory = AgendaCategory | 'habito'

const CATEGORY_STYLES: Record<
  EntryCategory,
  { bg: string; border: string; text: string; badge: string }
> = {
  pessoal: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/15',
    border: 'border-l-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  },
  trabalho: {
    bg: 'bg-blue-500/10 hover:bg-blue-500/15',
    border: 'border-l-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  },
  saude: {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  },
  financas: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/15',
    border: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  },
  outro: {
    bg: 'bg-slate-500/10 hover:bg-slate-500/15',
    border: 'border-l-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  },
  habito: {
    bg: 'bg-pink-500/10 hover:bg-pink-500/15',
    border: 'border-l-pink-500',
    text: 'text-pink-700 dark:text-pink-300',
    badge: 'bg-pink-500/15 text-pink-600 dark:text-pink-300',
  },
}

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

const FILTER_CATEGORIES: { value: EntryCategory; label: string }[] = [
  ...AGENDA_CATEGORIES,
  { value: 'habito', label: 'Hábitos' },
]

const DAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const START_HOUR = 5
const END_HOUR = 23

interface AgendaEntry {
  id: string
  kind: 'task' | 'habit'
  title: string
  description?: string | null
  time: string // HH:mm
  endTime?: string // HH:mm
  hour: number
  dateStr: string
  category: EntryCategory
  completed: boolean
}

function EventCard({
  entry,
  onToggle,
  onDelete,
  onEdit,
  compact,
}: {
  entry: AgendaEntry
  onToggle: (entry: AgendaEntry) => void
  onDelete: (entry: AgendaEntry) => void
  onEdit: (entry: AgendaEntry) => void
  compact?: boolean
}) {
  const style = CATEGORY_STYLES[entry.category] ?? CATEGORY_STYLES.outro
  return (
    <div
      className={cn(
        'group flex items-start gap-2 rounded-lg border-l-4 px-2.5 py-1.5 transition-colors cursor-pointer',
        style.bg,
        style.border,
        entry.completed && 'opacity-50',
      )}
      onClick={() => onEdit(entry)}
    >
      <Checkbox
        checked={entry.completed}
        onCheckedChange={() => onToggle(entry)}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-semibold leading-tight flex items-center gap-1',
            style.text,
            entry.completed && 'line-through',
          )}
        >
          {entry.endTime ? `${entry.time}–${entry.endTime}` : entry.time}
          {entry.kind === 'habit' && <Repeat size={10} />}
        </p>
        <p
          className={cn(
            'text-sm font-medium leading-tight truncate',
            entry.completed && 'line-through text-muted-foreground',
          )}
        >
          {entry.title}
        </p>
        {!compact && entry.description && (
          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
        )}
      </div>
      {entry.kind === 'task' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(entry)
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-0.5 shrink-0 transition-opacity"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

function HabitScheduleDialog({
  habit,
  open,
  setOpen,
  onSave,
}: {
  habit: Habit | undefined
  open: boolean
  setOpen: (v: boolean) => void
  onSave: (time: string | null, durationMinutes: number) => void
}) {
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(30)

  useEffect(() => {
    if (open && habit) {
      setTime(habit.scheduled_time?.slice(0, 5) || '')
      setDuration(habit.duration_minutes || 30)
    }
  }, [open, habit])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Hábito</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(time || null, duration)
              setOpen(false)
            }}
            className="gap-2"
          >
            <Save size={18} /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AgendaPage() {
  const { user } = useAuth()
  const { tasks, loading, updateTask, removeTask, toggleTask } = useAgenda()
  const { habits, habitLogsByDate, toggleHabitForDate, updateHabit, fetchHabitLogsRange } =
    useHabitsStore()
  const {
    customTrackers,
    trackerEntries,
    addTrackerEntry,
    deleteTrackerEntry,
    syncWithBackend,
  } = useCustomTrackersStore()

  const trackers = Object.values(customTrackers)
  const logs = Object.values(trackerEntries).flat()

  const [view, setView] = useState<'day' | 'week' | 'month' | 'routine'>('day')
  const [cursor, setCursor] = useState(new Date())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [slotDate, setSlotDate] = useState<Date | undefined>(undefined)
  const [targetPeriod, setTargetPeriod] = useState<'morning' | 'afternoon' | 'night' | null>(null)
  const [editingTask, setEditingTask] = useState<AgendaTask | undefined>(undefined)
  const [habitDialogOpen, setHabitDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined)

  // Tracker Log Dialog state
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [activeLogTaskId, setActiveLogTaskId] = useState<string | null>(null)
  const [activeLogTrackerId, setActiveLogTrackerId] = useState<string | null>(null)

  const openNewTaskDialog = (date?: Date, period?: 'morning' | 'afternoon' | 'night') => {
    setSlotDate(date || cursor)
    setTargetPeriod(period || null)
    setEditingTask(undefined)
    setDialogOpen(true)
  }
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EntryCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const monthDays = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd })

  const rangeStart = (view === 'day' || view === 'routine') ? cursor : view === 'week' ? weekStart : monthGridStart
  const rangeEnd = (view === 'day' || view === 'routine') ? cursor : view === 'week' ? weekEnd : monthGridEnd

  useEffect(() => {
    fetchHabitLogsRange(dateToStr(rangeStart), dateToStr(rangeEnd))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateToStr(rangeStart), dateToStr(rangeEnd)])

  const scheduledHabits = useMemo(() => habits.filter((h) => !!h.scheduled_time), [habits])

  const entriesForDay = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matchesFilters = (title: string, category: EntryCategory, completed: boolean) => {
      if (term && !title.toLowerCase().includes(term)) return false
      if (categoryFilter !== 'all' && category !== categoryFilter) return false
      if (statusFilter !== 'all' && (completed ? 'completed' : 'pending') !== statusFilter)
        return false
      return true
    }

    return (day: Date): AgendaEntry[] => {
      const dateStr = dateToStr(day)
      const entries: AgendaEntry[] = []

      tasks
        .filter((t) => isSameDay(new Date(t.due_date), day))
        .forEach((t) => {
          const completed = t.status === 'completed'
          if (!matchesFilters(t.title, t.category, completed)) return
          const start = new Date(t.due_date)
          const time = format(start, 'HH:mm')
          const end = new Date(start.getTime() + (t.duration_minutes || 60) * 60000)
          entries.push({
            id: t.id,
            kind: 'task',
            title: t.title,
            description: t.description,
            time,
            endTime: format(end, 'HH:mm'),
            hour: Number(time.slice(0, 2)),
            dateStr,
            category: t.category,
            completed,
          })
        })

      scheduledHabits.forEach((h) => {
        const completed = (habitLogsByDate[dateStr] || []).includes(h.id)
        if (!matchesFilters(h.title, 'habito', completed)) return
        const time = h.scheduled_time!.slice(0, 5)
        const [hh, mm] = time.split(':').map(Number)
        const endMinutes = hh * 60 + mm + (h.duration_minutes || 30)
        const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
        entries.push({
          id: h.id,
          kind: 'habit',
          title: h.title,
          description: h.description,
          time,
          endTime,
          hour: Number(time.slice(0, 2)),
          dateStr,
          category: 'habito',
          completed,
        })
      })

      return entries.sort((a, b) => a.time.localeCompare(b.time))
    }
  }, [tasks, scheduledHabits, habitLogsByDate, search, categoryFilter, statusFilter])

  const handleToggle = (entry: AgendaEntry) => {
    if (entry.kind === 'task') toggleTask(entry.id, entry.completed ? 'completed' : 'pending')
    else toggleHabitForDate(entry.id, entry.dateStr)
  }

  const handleToggleTask = async (task: AgendaTask) => {
    const selectedDate = dateToStr(cursor)
    if (task.tracker_id) {
      const tracker = customTrackers[task.tracker_id]
      const hasFields = tracker && tracker.validation && tracker.validation.length > 0

      const isCompleted = (() => {
        if (task.is_recurring) {
          const entries = trackerEntries[task.tracker_id] || []
          return entries.some((e) => e.task_id === task.id && e.date === selectedDate)
        }
        return task.status === 'completed'
      })()

      if (isCompleted) {
        // Toggle off: delete entry
        const entries = trackerEntries[task.tracker_id] || []
        const entryToDelete = entries.find((e) => e.task_id === task.id && e.date === selectedDate)
        if (entryToDelete) {
          await deleteTrackerEntry(task.tracker_id, entryToDelete.id)
          if (!task.is_recurring) {
            await toggleTask(task.id, task.status)
          }
          if (user) {
            await syncWithBackend(user.id)
          }
        }
      } else {
        // Toggle on: complete
        if (hasFields) {
          setActiveLogTaskId(task.id)
          setActiveLogTrackerId(task.tracker_id)
          setLogDialogOpen(true)
        } else {
          await addTrackerEntry(task.tracker_id, {
            task_id: task.id,
            date: selectedDate,
            values: { is_completed: true },
          })
          if (!task.is_recurring) {
            await toggleTask(task.id, task.status)
          }
          if (user) {
            await syncWithBackend(user.id)
          }
        }
      }
    } else {
      toggleTask(task.id, task.status)
    }
  }

  const handleDelete = (entry: AgendaEntry) => {
    if (entry.kind === 'task') removeTask(entry.id)
  }

  const handleEdit = (entry: AgendaEntry) => {
    if (entry.kind === 'task') {
      const task = tasks.find((t) => t.id === entry.id)
      if (!task) return
      setEditingTask(task)
      setSlotDate(undefined)
      setDialogOpen(true)
    } else {
      const habit = habits.find((h) => h.id === entry.id)
      if (!habit) return
      setEditingHabit(habit)
      setHabitDialogOpen(true)
    }
  }

  // Filter tasks for the selected date (considering Day of Week for recurring tasks)
  const dateTasks = useMemo(() => {
    const selectedDate = dateToStr(cursor)
    const dayOfWeek = (() => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const date = new Date(selectedDate + 'T00:00:00')
      return days[date.getDay()]
    })()

    return tasks.filter((t) => {
      if (t.is_recurring) {
        return t.days_of_week?.includes(dayOfWeek)
      }
      return t.due_date.split('T')[0] === selectedDate
    })
  }, [tasks, cursor])

  // Split tasks by period
  const morningTasks = useMemo(() => dateTasks.filter((t) => t.routine_period === 'morning'), [dateTasks])
  const afternoonTasks = useMemo(() => dateTasks.filter((t) => t.routine_period === 'afternoon'), [dateTasks])
  const nightTasks = useMemo(() => dateTasks.filter((t) => t.routine_period === 'night'), [dateTasks])
  const unassignedTasks = useMemo(() => dateTasks.filter((t) => !t.routine_period), [dateTasks])

  // Stats calculation
  const totalRoutineTasks = morningTasks.length + afternoonTasks.length + nightTasks.length
  const completedRoutineTasks = useMemo(() => {
    const selectedDate = dateToStr(cursor)
    return [...morningTasks, ...afternoonTasks, ...nightTasks].filter((t) => {
      if (t.is_recurring) {
        if (t.tracker_id) {
          const entries = trackerEntries[t.tracker_id] || []
          return entries.some((e) => e.task_id === t.id && e.date === selectedDate)
        }
        return false
      }
      return t.status === 'completed'
    }).length
  }, [morningTasks, afternoonTasks, nightTasks, trackerEntries, cursor])

  const completionPercent = totalRoutineTasks > 0 ? Math.round((completedRoutineTasks / totalRoutineTasks) * 100) : 0

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

  const hours = useMemo(() => {
    const dayEntries = entriesForDay(cursor)
    let min = START_HOUR
    let max = END_HOUR
    dayEntries.forEach((e) => {
      if (e.hour < min) min = e.hour
      if (e.hour > max) max = e.hour
    })
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [cursor, entriesForDay])

  const goPrev = () => {
    if (view === 'day' || view === 'routine') setCursor((d) => addDaysFns(d, -1))
    else if (view === 'week') setCursor((d) => addWeeks(d, -1))
    else setCursor((d) => addMonths(d, -1))
  }
  const goNext = () => {
    if (view === 'day' || view === 'routine') setCursor((d) => addDaysFns(d, 1))
    else if (view === 'week') setCursor((d) => addWeeks(d, 1))
    else setCursor((d) => addMonths(d, 1))
  }

  const periodLabel =
    (view === 'day' || view === 'routine')
      ? format(cursor, "EEEE, dd 'de' MMMM", { locale: ptBR })
      : view === 'week'
        ? `${format(weekStart, 'dd MMM', { locale: ptBR })} a ${format(weekEnd, 'dd MMM', { locale: ptBR })}`
        : format(cursor, 'MMMM yyyy', { locale: ptBR })

  const viewLabel = view === 'day' ? 'Diária' : view === 'week' ? 'Semanal' : view === 'month' ? 'Mensal' : 'Rotinas'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-baseline gap-2">
            Agenda
            <span className="italic font-serif text-primary text-2xl">· {viewLabel}</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm capitalize min-w-[180px]">{periodLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="routine">Rotinas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openNewTaskDialog()} className="rounded-xl gap-2">
            <Plus size={18} /> Novo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {FILTER_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : view === 'routine' ? (
        <div className="space-y-6">
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
                  {morningTasks.filter((t) => {
                    const selectedDate = dateToStr(cursor)
                    if (t.is_recurring && t.tracker_id) {
                      const entries = trackerEntries[t.tracker_id] || []
                      return entries.some((e) => e.task_id === t.id && e.date === selectedDate)
                    }
                    return t.status === 'completed'
                  }).length}/{morningTasks.length}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
                {morningTasks.length > 0 ? (
                  morningTasks.map((task) => (
                    <RoutineTaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task)}
                      onDelete={() => removeTask(task.id)}
                      onEdit={() => {
                        setEditingTask(task)
                        setSlotDate(undefined)
                        setDialogOpen(true)
                      }}
                      trackers={trackers}
                      logs={logs}
                      selectedDate={dateToStr(cursor)}
                      trackerEntries={trackerEntries}
                    />
                  ))
                ) : (
                  <EmptyBlockState text="Sem tarefas agendadas para a manhã." />
                )}
              </div>

              <div className="p-4 border-t border-border/40">
                <Button
                  onClick={() => openNewTaskDialog(cursor, 'morning')}
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
                  {afternoonTasks.filter((t) => {
                    const selectedDate = dateToStr(cursor)
                    if (t.is_recurring && t.tracker_id) {
                      const entries = trackerEntries[t.tracker_id] || []
                      return entries.some((e) => e.task_id === t.id && e.date === selectedDate)
                    }
                    return t.status === 'completed'
                  }).length}/{afternoonTasks.length}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
                {afternoonTasks.length > 0 ? (
                  afternoonTasks.map((task) => (
                    <RoutineTaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task)}
                      onDelete={() => removeTask(task.id)}
                      onEdit={() => {
                        setEditingTask(task)
                        setSlotDate(undefined)
                        setDialogOpen(true)
                      }}
                      trackers={trackers}
                      logs={logs}
                      selectedDate={dateToStr(cursor)}
                      trackerEntries={trackerEntries}
                    />
                  ))
                ) : (
                  <EmptyBlockState text="Sem tarefas agendadas para a tarde." />
                )}
              </div>

              <div className="p-4 border-t border-border/40">
                <Button
                  onClick={() => openNewTaskDialog(cursor, 'afternoon')}
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
                  {nightTasks.filter((t) => {
                    const selectedDate = dateToStr(cursor)
                    if (t.is_recurring && t.tracker_id) {
                      const entries = trackerEntries[t.tracker_id] || []
                      return entries.some((e) => e.task_id === t.id && e.date === selectedDate)
                    }
                    return t.status === 'completed'
                  }).length}/{nightTasks.length}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
                {nightTasks.length > 0 ? (
                  nightTasks.map((task) => (
                    <RoutineTaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task)}
                      onDelete={() => removeTask(task.id)}
                      onEdit={() => {
                        setEditingTask(task)
                        setSlotDate(undefined)
                        setDialogOpen(true)
                      }}
                      trackers={trackers}
                      logs={logs}
                      selectedDate={dateToStr(cursor)}
                      trackerEntries={trackerEntries}
                    />
                  ))
                ) : (
                  <EmptyBlockState text="Sem tarefas agendadas para a noite." />
                )}
              </div>

              <div className="p-4 border-t border-border/40">
                <Button
                  onClick={() => openNewTaskDialog(cursor, 'night')}
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
                  Você criou essas tarefas na Agenda. Organize-as na sua rotina escolhendo um período abaixo:
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
        </div>
      ) : (
        <div className="glass-card rounded-2xl border-none overflow-hidden">
          {view === 'day' && (
            <div className="grid grid-cols-[64px_1fr] divide-y divide-border/60">
              {hours.map((hour) => {
                const hourEntries = entriesForDay(cursor).filter((e) => e.hour === hour)
                return (
                  <div key={hour} className="contents">
                    <div className="text-xs text-muted-foreground pt-3 pr-2 text-right border-r border-border/60">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const d = new Date(cursor)
                        d.setHours(hour, 0, 0, 0)
                        openNewTaskDialog(d)
                      }}
                      className="min-h-[56px] p-1.5 space-y-1 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      {hourEntries.map((e) => (
                        <div key={`${e.kind}-${e.id}`} onClick={(ev) => ev.stopPropagation()}>
                          <EventCard
                            entry={e}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'week' && (
            <div className="grid grid-cols-7 divide-x divide-border/60">
              {weekDays.map((day, i) => (
                <div key={i} className="min-h-[420px] flex flex-col">
                  <div
                    className={cn(
                      'text-center py-2 border-b border-border/60 sticky top-0 bg-card/80 backdrop-blur',
                      isToday(day) && 'bg-primary/5',
                    )}
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {DAY_LABELS[i]}
                    </p>
                    <p className={cn('text-sm font-bold', isToday(day) && 'text-primary')}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(9, 0, 0, 0)
                      openNewTaskDialog(d)
                    }}
                    className="p-1.5 space-y-1.5 flex-1 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    {entriesForDay(day).map((e) => (
                      <div key={`${e.kind}-${e.id}`} onClick={(ev) => ev.stopPropagation()}>
                        <EventCard
                          entry={e}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'month' && (
            <div>
              <div className="grid grid-cols-7 border-b border-border/60">
                {DAY_LABELS.map((d) => (
                  <div
                    key={d}
                    className="text-center py-2 text-[10px] font-semibold text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day, i) => {
                  const dayEntries = entriesForDay(day)
                  const visible = dayEntries.slice(0, 3)
                  const overflow = dayEntries.length - visible.length
                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const d = new Date(day)
                        d.setHours(9, 0, 0, 0)
                        openNewTaskDialog(d)
                      }}
                      className={cn(
                        'min-h-[110px] p-1.5 border-b border-r border-border/60 space-y-1 cursor-pointer hover:bg-muted/40 transition-colors',
                        !isSameMonth(day, cursor) && 'bg-muted/30',
                      )}
                    >
                      <p
                        className={cn(
                          'text-xs font-medium',
                          !isSameMonth(day, cursor) && 'text-muted-foreground/50',
                          isToday(day) &&
                            'inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground',
                        )}
                      >
                        {format(day, 'd')}
                      </p>
                      {visible.map((e) => {
                        const style = CATEGORY_STYLES[e.category] ?? CATEGORY_STYLES.outro
                        return (
                          <div
                            key={`${e.kind}-${e.id}`}
                            onClick={(ev) => {
                              ev.stopPropagation()
                              handleEdit(e)
                            }}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:brightness-95',
                              style.badge,
                              e.completed && 'line-through opacity-60',
                            )}
                          >
                            {e.time} {e.title}
                          </div>
                        )
                      })}
                      {overflow > 0 && (
                        <p className="text-[10px] text-muted-foreground px-1.5">+{overflow} mais</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AgendaTaskDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        initialDate={slotDate}
        initialPeriod={targetPeriod}
        task={editingTask}
        onDeleted={removeTask}
      />
      <HabitScheduleDialog
        habit={editingHabit}
        open={habitDialogOpen}
        setOpen={setHabitDialogOpen}
        onSave={(time, durationMinutes) => {
          if (editingHabit)
            updateHabit(editingHabit.id, {
              scheduled_time: time,
              duration_minutes: durationMinutes,
            })
        }}
      />
      <TrackerLogDialog
        open={logDialogOpen}
        setOpen={setLogDialogOpen}
        taskId={activeLogTaskId}
        trackerId={activeLogTrackerId}
      />
    </div>
  )
}

function RoutineTaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  trackers = [],
  logs = [],
  selectedDate,
  trackerEntries,
}: {
  task: AgendaTask
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
  trackers?: any[]
  logs?: any[]
  selectedDate?: string
  trackerEntries?: Record<string, any[]>
}) {
  const isCompleted = (() => {
    if (task.is_recurring && task.tracker_id && selectedDate && trackerEntries) {
      const entries = trackerEntries[task.tracker_id] || []
      return entries.some((e) => e.task_id === task.id && e.date === selectedDate)
    }
    return task.status === 'completed'
  })()
  const cat = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS.outro
  const CatIcon = cat.icon

  const associatedTracker = trackers.find((t) => t.id === task.tracker_id)
  const associatedLog = logs.find((l) => l.task_id === task.id && l.date === selectedDate)

  return (
    <div
      onClick={onEdit}
      className={cn(
        'group flex items-start justify-between gap-3 p-3 rounded-xl border border-border/70 transition-all duration-200 shadow-sm hover:shadow bg-background cursor-pointer hover:border-primary/30',
        isCompleted && 'bg-muted/40 border-muted/50 hover:border-muted',
      )}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
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
                const field = associatedTracker.validation.find((f: any) => f.name === key)
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
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
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
