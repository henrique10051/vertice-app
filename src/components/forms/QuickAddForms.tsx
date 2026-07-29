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
import { Plus, X, Trash2, Settings } from 'lucide-react'
import useHabitsStore from '@/stores/useHabitsStore'
import useFinancesStore, { type Transaction } from '@/stores/useFinancesStore'
import { getTodayStr } from '@/lib/date-utils'
import { DURATION_OPTIONS } from '@/lib/duration-options'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { useCustomTrackersStore, sanitizeFieldName } from '@/stores/useCustomTrackersStore'
import type { TrackerField, FieldType } from '@/services/custom-trackers-schema'

export function HabitForm({ onSuccess }: { onSuccess: () => void }) {
  const { addHabit } = useHabitsStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [description, setDescription] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(30)

  // Custom fields state
  const [hasMetrics, setHasMetrics] = useState(false)
  const [fields, setFields] = useState<TrackerField[]>([])
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('number')
  const [fieldRequired, setFieldRequired] = useState(true)

  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      toast({
        title: 'Rótulo obrigatório',
        description: 'Por favor, dê um rótulo ao campo de dados.',
        variant: 'destructive',
      })
      return
    }

    const cleanName = sanitizeFieldName(fieldLabel)
    if (fields.some((f) => f.name === cleanName)) {
      toast({
        title: 'Nome de campo já existe',
        description: 'Crie um campo com um nome diferente.',
        variant: 'destructive',
      })
      return
    }

    const newField: TrackerField = {
      name: cleanName,
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
    }

    setFields([...fields, newField])
    setFieldLabel('')
    setFieldType('number')
    setFieldRequired(true)
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    const { error } = await addHabit(
      name,
      frequency,
      description,
      scheduledTime || null,
      duration,
      hasMetrics ? fields : [],
      'card'
    )
    if (error) {
      toast({ title: 'Erro ao criar hábito', description: error, variant: 'destructive' })
      return
    }

    if (user) {
      await useCustomTrackersStore.getState().loadFromBackend(user.id)
    }

    toast({ title: 'Hábito criado!', description: `${name} foi adicionado.` })
    onSuccess()
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4 animate-fade-in max-h-[80vh] overflow-y-auto pr-1">
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
          <p className="text-xs text-muted-foreground">
            Se você ativou lembretes push no Perfil, o app avisa nesse horário.
          </p>
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

      {/* Switch for custom metrics */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
        <div className="space-y-0.5">
          <Label htmlFor="has-metrics" className="text-sm font-semibold cursor-pointer">
            Métricas / Campos Personalizados
          </Label>
          <p className="text-[10px] text-muted-foreground">
            Adicione campos para medir (ex: litros, páginas, calorias)
          </p>
        </div>
        <Switch id="has-metrics" checked={hasMetrics} onCheckedChange={setHasMetrics} />
      </div>

      {/* Metrics builder */}
      {hasMetrics && (
        <div className="space-y-3 p-3 rounded-xl border border-border/50 bg-muted/10 animate-in fade-in duration-200">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Settings size={12} /> Configurar Campos de Medição
          </Label>

          {/* Active fields list */}
          {fields.length > 0 ? (
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
              {fields.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-card border border-border/50 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{f.label}</span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded font-mono text-muted-foreground">
                      {f.type}
                    </span>
                    {f.required && (
                      <span className="text-[8px] bg-destructive/10 text-destructive px-1.5 py-0.2 rounded font-bold">
                        Obrigo.
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 text-muted-foreground hover:text-destructive rounded-full"
                    onClick={() => handleRemoveField(idx)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic pl-1">
              Nenhum campo adicionado. Adicione um abaixo.
            </p>
          )}

          {/* Add field inline */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Rótulo (ex: Peso, Litros)</Label>
                <Input
                  placeholder="Nome do campo"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="h-8 text-xs px-2.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Tipo de Dado</Label>
                <Select value={fieldType} onValueChange={(v: any) => setFieldType(v)}>
                  <SelectTrigger className="h-8 text-xs px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texto Simples</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Chave Sim/Não</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="string[]">Lista de Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 py-1 bg-card rounded-lg border border-border/40">
              <span className="text-[10px] font-medium">Obrigatório</span>
              <Switch
                checked={fieldRequired}
                onCheckedChange={setFieldRequired}
                className="scale-75"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddField}
              className="w-full h-8 text-xs bg-primary/10 hover:bg-primary/15 text-primary border-none"
              variant="outline"
            >
              <Plus size={12} className="mr-1" /> Adicionar Campo ao Esquema
            </Button>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full">
        Salvar Hábito
      </Button>
    </form>
  )
}

export function FinanceForm({
  onSuccess,
  transaction,
}: {
  onSuccess: () => void
  transaction?: Transaction
}) {
  const {
    addTransaction,
    updateTransaction,
    financeCategories,
    addFinanceCategory,
    deleteFinanceCategory,
  } = useFinancesStore()
  const { toast } = useToast()
  const isEditing = !!transaction
  const [desc, setDesc] = useState(transaction?.description || '')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense')
  const [cat, setCat] = useState<any>(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || getTodayStr())
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
    const payload = { description: desc, amount: Number(amount), type, category: cat, date }
    if (isEditing && transaction) {
      await updateTransaction(transaction.id, payload)
      toast({ title: 'Transação atualizada!', description: `${desc} foi ajustada.` })
    } else {
      await addTransaction(payload)
      toast({ title: 'Transação salva!', description: `${desc} registrada com sucesso.` })
    }
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
        <Label>Data</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
        {isEditing ? 'Salvar Alterações' : 'Salvar Transação'}
      </Button>
    </form>
  )
}
