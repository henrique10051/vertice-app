import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AgendaTaskDialog, AGENDA_CATEGORIES, DURATION_OPTIONS } from '@/components/AgendaTaskDialog'
import { useAgenda } from '@/hooks/use-agenda'
import useHabitsStore from '@/stores/useHabitsStore'
import { dateToStr } from '@/lib/date-utils'
import { Plus, ArrowLeft, ChevronLeft, ChevronRight, Trash2, Search, Repeat, Loader2, Save } from 'lucide-react'
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
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { AgendaCategory, AgendaTask } from '@/services/agenda'
import type { Habit } from '@/stores/useHabitsStore'

type EntryCategory = AgendaCategory | 'habito'

const CATEGORY_STYLES: Record<EntryCategory, { bg: string; border: string; text: string; badge: string }> = {
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
        <p className={cn('text-xs font-semibold leading-tight flex items-center gap-1', style.text, entry.completed && 'line-through')}>
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
  const { tasks, loading, toggleTask, removeTask } = useAgenda()
  const { habits, habitLogsByDate, toggleHabitForDate, updateHabit, fetchHabitLogsRange } =
    useHabitsStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [slotDate, setSlotDate] = useState<Date | undefined>(undefined)
  const [editingTask, setEditingTask] = useState<AgendaTask | undefined>(undefined)
  const [habitDialogOpen, setHabitDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined)
  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [cursor, setCursor] = useState(new Date())

  const openNewTaskDialog = (date?: Date) => {
    setSlotDate(date)
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

  const rangeStart = view === 'day' ? cursor : view === 'week' ? weekStart : monthGridStart
  const rangeEnd = view === 'day' ? cursor : view === 'week' ? weekEnd : monthGridEnd

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
      if (statusFilter !== 'all' && (completed ? 'completed' : 'pending') !== statusFilter) return false
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
    if (view === 'day') setCursor((d) => addDays(d, -1))
    else if (view === 'week') setCursor((d) => addWeeks(d, -1))
    else setCursor((d) => addMonths(d, -1))
  }
  const goNext = () => {
    if (view === 'day') setCursor((d) => addDays(d, 1))
    else if (view === 'week') setCursor((d) => addWeeks(d, 1))
    else setCursor((d) => addMonths(d, 1))
  }

  const periodLabel =
    view === 'day'
      ? format(cursor, "EEEE, dd 'de' MMMM", { locale: ptBR })
      : view === 'week'
        ? `${format(weekStart, 'dd MMM', { locale: ptBR })} a ${format(weekEnd, 'dd MMM', { locale: ptBR })}`
        : format(cursor, 'MMMM yyyy', { locale: ptBR })

  const viewLabel = view === 'day' ? 'Diária' : view === 'week' ? 'Semanal' : 'Mensal'

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
                          <EventCard entry={e} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
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
                    <p
                      className={cn(
                        'text-sm font-bold',
                        isToday(day) && 'text-primary',
                      )}
                    >
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
                        <EventCard entry={e} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} compact />
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
        task={editingTask}
        onDeleted={removeTask}
      />
      <HabitScheduleDialog
        habit={editingHabit}
        open={habitDialogOpen}
        setOpen={setHabitDialogOpen}
        onSave={(time, durationMinutes) => {
          if (editingHabit) updateHabit(editingHabit.id, { scheduled_time: time, duration_minutes: durationMinutes })
        }}
      />
    </div>
  )
}
