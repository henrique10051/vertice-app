import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import useGoalsStore, { type Goal } from '@/stores/useGoalsStore'
import { useToast } from '@/hooks/use-toast'

type SubtaskRow = { id?: string; title: string }

export function GoalFormDialog({
  open,
  setOpen,
  goal,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  goal?: Goal
}) {
  const { addGoal, updateGoal } = useGoalsStore()
  const { toast } = useToast()
  const isEditing = !!goal

  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [subtasks, setSubtasks] = useState<SubtaskRow[]>([{ title: '' }])

  useEffect(() => {
    if (!open) return
    if (goal) {
      setTitle(goal.title)
      setTargetDate(goal.targetDate)
      setSubtasks(goal.subtasks.map((s) => ({ id: s.id, title: s.title })))
    } else {
      setTitle('')
      setTargetDate('')
      setSubtasks([{ title: '' }])
    }
  }, [open, goal])

  const updateSubtaskTitle = (index: number, value: string) => {
    setSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, title: value } : s)))
  }

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index))
  }

  const addSubtaskRow = () => setSubtasks((prev) => [...prev, { title: '' }])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetDate) return

    if (isEditing && goal) {
      updateGoal(goal.id, { title: title.trim(), targetDate, subtasks })
      toast({ title: 'Objetivo atualizado!' })
    } else {
      addGoal(
        title.trim(),
        targetDate,
        subtasks.map((s) => s.title),
      )
      toast({ title: 'Objetivo criado!' })
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Objetivo' : 'Novo Objetivo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2 animate-fade-in">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Ex: Fundo de Emergência"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Data alvo</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Passos</Label>
            <div className="space-y-2">
              {subtasks.map((s, i) => (
                <div key={s.id ?? i} className="flex gap-2">
                  <Input
                    placeholder={`Passo ${i + 1}`}
                    value={s.title}
                    onChange={(e) => updateSubtaskTitle(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSubtask(i)}
                    aria-label="Remover passo"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSubtaskRow} className="gap-1">
              <Plus size={14} /> Adicionar passo
            </Button>
          </div>
          <Button type="submit" className="w-full">
            {isEditing ? 'Salvar Alterações' : 'Salvar Objetivo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
