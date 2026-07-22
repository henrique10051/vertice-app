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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgenda } from '@/hooks/use-agenda'
import { useToast } from '@/hooks/use-toast'
import type { AgendaCategory, AgendaTask } from '@/services/agenda'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import { Plus, Save, Trash2 } from 'lucide-react'

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
  task,
  onDeleted,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  initialDate?: Date
  task?: AgendaTask
  onDeleted?: (id: string) => void
}) {
  const { addTask, updateTask } = useAgenda()
  const { toast } = useToast()
  const isEditing = !!task
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(getDefaultDateTime(initialDate))
  const [category, setCategory] = useState<AgendaCategory>('pessoal')
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(toDateTimeLocal(task.due_date))
      setCategory(task.category)
      setDuration(task.duration_minutes || 60)
    } else {
      setTitle('')
      setDescription('')
      setDueDate(getDefaultDateTime(initialDate))
      setCategory('pessoal')
      setDuration(60)
    }
  }, [open, initialDate, task])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    if (isEditing && task) {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: new Date(dueDate).toISOString(),
        category,
        duration_minutes: duration,
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
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao criar compromisso', description: error, variant: 'destructive' })
      return
    }
    setOpen(false)
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
          <div className="space-y-2">
            <Label>Duração</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
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
