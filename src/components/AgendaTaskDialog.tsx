import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { useAgenda } from '@/hooks/use-agenda'
import { useCustomTrackersStore } from '@/stores/useCustomTrackersStore'
import { useToast } from '@/hooks/use-toast'
import type { AgendaCategory, AgendaTask } from '@/services/agenda'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

function getDefaultDateTime(base?: Date): string {
  const now = base ? new Date(base) : new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  if (!base) now.setHours(now.getHours() + 1, 0, 0, 0)
  return now.toISOString().slice(0, 16)
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const AGENDA_CATEGORIES: { value: AgendaCategory; label: string }[] = [
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'saude', label: 'Saúde' },
  { value: 'financas', label: 'Finanças' },
  { value: 'outro', label: 'Outro' },
]

export { DURATION_OPTIONS }

export function AgendaTaskDialog({
  open,
  setOpen,
  initialDate,
  initialPeriod,
  task,
  onDeleted,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  initialDate?: Date
  initialPeriod?: 'morning' | 'afternoon' | 'night' | null
  task?: AgendaTask
  onDeleted?: (id: string) => void
}) {
  const { user } = useAuth()
  const { addTask, updateTask } = useAgenda()
  const { customTrackers, addCustomTracker, syncWithBackend } = useCustomTrackersStore()
  const trackers = Object.values(customTrackers)
  const { toast } = useToast()
  const isEditing = !!task
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(getDefaultDateTime(initialDate))
  const [category, setCategory] = useState<AgendaCategory>('pessoal')
  const [duration, setDuration] = useState(60)
  const [trackerId, setTrackerId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Routine-specific states
  const [routinePeriod, setRoutinePeriod] = useState<'morning' | 'afternoon' | 'night' | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [createTrackerAuto, setCreateTrackerAuto] = useState(true)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(toDateTimeLocal(task.due_date))
      setCategory(task.category)
      setDuration(task.duration_minutes || 60)
      setTrackerId(task.tracker_id || '')
      setRoutinePeriod(task.routine_period || null)
      setIsRecurring(task.is_recurring || false)
      setDaysOfWeek(task.days_of_week || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
      setCreateTrackerAuto(false)
    } else {
      setTitle('')
      setDescription('')
      setDueDate(getDefaultDateTime(initialDate))
      setCategory('pessoal')
      setDuration(60)
      setTrackerId('')
      setRoutinePeriod(initialPeriod || null)
      setIsRecurring(false)
      setDaysOfWeek(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
      setCreateTrackerAuto(true)
    }
  }, [open, initialDate, initialPeriod, task])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)

    let finalTrackerId = trackerId === '_none' ? null : trackerId || null

    try {
      // Automatically create tracker (habit) if selected, recurring, and no tracker selected
      if (!isEditing && isRecurring && createTrackerAuto && !finalTrackerId) {
        const newTracker = await addCustomTracker({
          name: title.trim(),
          is_habit: true,
          frequency: 'daily',
          validation: [],
          view_type: 'card',
        })
        finalTrackerId = newTracker.id
        if (user) {
          await syncWithBackend(user.id)
        }
      }

      if (isEditing && task) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          due_date: new Date(dueDate).toISOString(),
          category,
          duration_minutes: duration,
          tracker_id: finalTrackerId,
          routine_period: routinePeriod,
          is_recurring: isRecurring,
          days_of_week: isRecurring ? daysOfWeek : [],
        })
        setSaving(false)
        setOpen(false)
        return
      }

      const { error } = await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: new Date(dueDate).toISOString(),
        category,
        duration_minutes: duration,
        tracker_id: finalTrackerId,
        routine_period: routinePeriod,
        is_recurring: isRecurring,
        days_of_week: isRecurring ? daysOfWeek : [],
      })

      setSaving(false)
      if (error) {
        toast({ title: 'Erro ao criar compromisso', description: error, variant: 'destructive' })
        return
      }
      setOpen(false)
    } catch (err: any) {
      setSaving(false)
      toast({
        title: 'Erro ao salvar compromisso',
        description: err.message || 'Erro inesperado.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com o time"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do compromisso..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v: AgendaCategory) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENDA_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Período da Rotina</Label>
              <Select value={routinePeriod || '_none'} onValueChange={(v) => setRoutinePeriod(v === '_none' ? null : v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (Agenda)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum (Agenda)</SelectItem>
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rastreador Customizado</Label>
            <Select value={trackerId || '_none'} onValueChange={(v) => setTrackerId(v === '_none' ? '' : v)}>
              <SelectTrigger>
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

          {/* Recurrent / Routine Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="is-recurring" className="text-sm font-semibold cursor-pointer">Repetir semanalmente</Label>
              <p className="text-[10px] text-muted-foreground">Repetir esta tarefa nos dias selecionados</p>
            </div>
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Days of week selector if recurring */}
          {isRecurring && (
            <div className="space-y-2.5 p-3 rounded-lg border border-border/50 bg-muted/10 animate-in fade-in duration-200">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dias da semana</Label>
              <div className="flex justify-between gap-1">
                {[
                  { key: 'monday', label: 'S' },
                  { key: 'tuesday', label: 'T' },
                  { key: 'wednesday', label: 'Q' },
                  { key: 'thursday', label: 'Q' },
                  { key: 'friday', label: 'S' },
                  { key: 'saturday', label: 'S' },
                  { key: 'sunday', label: 'D' },
                ].map((day) => {
                  const isSelected = daysOfWeek.includes(day.key)
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => {
                        setDaysOfWeek((prev) =>
                          prev.includes(day.key)
                            ? prev.filter((d) => d !== day.key)
                            : [...prev, day.key],
                        )
                      }}
                      className={cn(
                        'w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center border transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-muted border-border text-muted-foreground',
                      )}
                      title={day.key}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>

              {/* Auto tracker checkbox */}
              {!isEditing && !trackerId && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-border/40 mt-1.5">
                  <Checkbox
                    id="auto-tracker"
                    checked={createTrackerAuto}
                    onCheckedChange={(checked) => setCreateTrackerAuto(!!checked)}
                  />
                  <Label htmlFor="auto-tracker" className="text-xs text-muted-foreground cursor-pointer font-medium">
                    Criar hábito/rastreador automaticamente
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center sm:justify-between">
          {isEditing && task ? (
            <button
              onClick={() => {
                onDeleted?.(task.id)
                setOpen(false)
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-rose-500 transition-colors mr-auto"
            >
              <Trash2 size={15} /> Excluir
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="gap-2">
              {isEditing ? <Save size={18} /> : <Plus size={18} />}
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
