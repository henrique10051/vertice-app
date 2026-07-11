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
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore from '@/stores/useFinancesStore'
import { getTodayStr } from '@/lib/date-utils'
import { useToast } from '@/hooks/use-toast'

export function HabitForm({ onSuccess }: { onSuccess: () => void }) {
  const { addHabit } = useHabitsStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [description, setDescription] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await addHabit(name, frequency, description)
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
      <Button type="submit" className="w-full">
        Salvar Hábito
      </Button>
    </form>
  )
}

export function FinanceForm({ onSuccess }: { onSuccess: () => void }) {
  const { addTransaction } = useFinancesStore()
  const { toast } = useToast()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [cat, setCat] = useState<any>('Alimentação')

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
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Moradia">Moradia</SelectItem>
            <SelectItem value="Alimentação">Alimentação</SelectItem>
            <SelectItem value="Transporte">Transporte</SelectItem>
            <SelectItem value="Educação/Crescimento">Educação/Crescimento</SelectItem>
            <SelectItem value="Renda">Renda</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Salvar Transação
      </Button>
    </form>
  )
}
