import { useState } from 'react'
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
import { Plus, X } from 'lucide-react'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import { getTodayStr } from '@/lib/date-utils'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import { useToast } from '@/hooks/use-toast'

export function HabitForm({ onSuccess }: { onSuccess: () => void }) {
  const { addHabit } = useHabitsStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [description, setDescription] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(30)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    const { error } = await addHabit(name, frequency, description, scheduledTime || null, duration)
    if (error) {
      toast({ title: 'Erro ao criar hábito', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Hábito criado!', description: `${name} foi adicionado.` })
    onSuccess()
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4 animate-fade-in">
      <div className="space-y-2">
        <Label>Nome do Hábito</Label>
        <Input
          placeholder="Ex: Meditar por 10 min"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          placeholder="Ex: Meditação guiada ao acordar"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Frequência</Label>
        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diária</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Horário fixo (opcional)</Label>
          <Input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
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
      <p className="text-xs text-muted-foreground -mt-2">
        Definindo um horário, o hábito passa a aparecer na Agenda todos os dias.
      </p>
      <Button type="submit" className="w-full">
        Salvar Hábito
      </Button>
    </form>
  )
}

export function FinanceForm({ onSuccess }: { onSuccess: () => void }) {
  const { addTransaction, financeCategories, addFinanceCategory, deleteFinanceCategory } =
    useFinancesStore()
  const { toast } = useToast()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [cat, setCat] = useState<any>('')
  const [newCat, setNewCat] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  if (!cat && financeCategories.length > 0) setCat(financeCategories[0])

  const handleAddCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    await addFinanceCategory(name)
    setCat(name)
    setNewCat('')
    setAddingCat(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc || !amount) return
    await addTransaction({
      description: desc,
      amount: Number(amount),
      type,
      category: cat,
      date: getTodayStr(),
    })
    toast({ title: 'Transação salva!', description: `${desc} registrada com sucesso.` })
    onSuccess()
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="income">Renda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          placeholder="Ex: Almoço"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <div className="flex gap-2">
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {financeCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setAddingCat((v) => !v)}
            aria-label="Nova categoria"
          >
            <Plus size={16} />
          </Button>
        </div>
        {addingCat && (
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              autoFocus
            />
            <Button type="button" onClick={handleAddCategory}>
              Adicionar
            </Button>
          </div>
        )}
        {financeCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {financeCategories.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1 text-muted-foreground"
              >
                {c}
                <button
                  type="button"
                  onClick={() => {
                    deleteFinanceCategory(c)
                    if (cat === c) setCat('')
                  }}
                  aria-label={`Remover categoria ${c}`}
                  className="hover:text-rose-500"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" className="w-full">
        Salvar Transação
      </Button>
    </form>
  )
}
