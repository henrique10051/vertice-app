import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { ClipboardList, Plus, Trash2, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/currency'
import { useToast } from '@/hooks/use-toast'
import { sumActiveInstallments } from '@/lib/finance-projection'
import useFinancesStore from '@/stores/useFinancesStore'
import type { Budget } from '@/stores/useFinancesStore'

function nextMonthKey() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function nextMonthLabel() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function BudgetPlanningCard() {
  const { budgets, financeCategories, addBudget, deleteBudget, installmentPurchases } =
    useFinancesStore()
  const { toast } = useToast()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const month = nextMonthKey()
  const monthBudgets = useMemo(
    () => budgets.filter((b: Budget) => b.month === month),
    [budgets, month],
  )
  const incomeItems = monthBudgets.filter((b) => b.type === 'income')
  const expenseItems = monthBudgets.filter((b) => b.type === 'expense')
  const installmentsTotal = useMemo(
    () => sumActiveInstallments(installmentPurchases, month.slice(0, 7)),
    [installmentPurchases, month],
  )
  const totalIncome = incomeItems.reduce((s, b) => s + b.amount, 0)
  const totalExpense = expenseItems.reduce((s, b) => s + b.amount, 0) + installmentsTotal
  const balance = totalIncome - totalExpense

  const cat = category || financeCategories[0] || ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cat || !amount || Number(amount) <= 0) return
    setSaving(true)
    const { error } = await addBudget({
      month,
      type,
      category: cat,
      amount: Number(amount),
      description: description.trim() || null,
    })
    setSaving(false)
    if (error) {
      toast({
        title: 'Não foi possível salvar a previsão',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Previsão salva',
      description: `${cat}: ${formatBRL(Number(amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    })
    setAmount('')
    setDescription('')
  }

  const handleDelete = async (b: Budget) => {
    await deleteBudget(b.id)
    toast({ title: 'Previsão removida', description: b.category })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
          <ClipboardList size={20} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight capitalize">
            Previsão de {nextMonthLabel()}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadastre o que você tem projetado para ganhar e gastar no próximo mês para comparar com a
            realidade depois.
          </p>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:w-64">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium transition-colors',
                  type === 'expense'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-input text-muted-foreground hover:bg-muted',
                )}
              >
                <TrendingDown size={15} /> Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium transition-colors',
                  type === 'income'
                    ? 'border-chart-4/40 bg-chart-4/10 text-chart-4'
                    : 'border-input text-muted-foreground hover:bg-muted',
                )}
              >
                <TrendingUp size={15} /> Ganho
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={cat} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {financeCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor previsto</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-9"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving || !cat || !amount} className="gap-1.5">
                <Plus size={16} /> Adicionar
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input
                type="text"
                placeholder="Ex: aluguel, parcela do curso..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {monthBudgets.length === 0 && installmentsTotal === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="p-10 flex flex-col items-center text-center gap-1">
            <p className="text-sm font-medium">Nenhuma previsão cadastrada ainda</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Use o formulário acima para registrar quanto espera ganhar e gastar em cada
              categoria no próximo mês.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <TrendingUp size={13} className="text-chart-4" /> Ganhos previstos
                </div>
                <p className="data-num text-2xl font-bold text-chart-4">
                  + {formatBRL(totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <TrendingDown size={13} className="text-destructive" /> Gastos previstos
                </div>
                <p className="data-num text-2xl font-bold text-destructive">
                  − {formatBRL(totalExpense)}
                </p>
                {installmentsTotal > 0 && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                    <CreditCard size={11} />
                    inclui{' '}
                    <span className="data-num">{formatBRL(installmentsTotal)}</span> em parcelas
                    fixas
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-lg border-primary/25 bg-accent/40 dark:bg-primary/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <Wallet size={13} className="text-primary" /> Saldo previsto
                </div>
                <p
                  className={cn(
                    'data-num text-2xl font-bold',
                    balance >= 0 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {balance >= 0 ? '+ ' : '− '}
                  {formatBRL(Math.abs(balance))}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BudgetList title="Ganhos" items={incomeItems} onDelete={handleDelete} />
            <BudgetList title="Gastos" items={expenseItems} onDelete={handleDelete} />
          </div>
        </>
      )}
    </div>
  )
}

function BudgetList({
  title,
  items,
  onDelete,
}: {
  title: string
  items: Budget[]
  onDelete: (b: Budget) => void
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nada cadastrado nesta categoria.</p>
        ) : (
          <div className="space-y-1">
            {items.map((b) => (
              <div
                key={b.id}
                className="group flex items-center justify-between rounded-md px-2 py-2 -mx-2 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{b.category}</span>
                  {b.description && (
                    <p className="text-xs text-muted-foreground truncate">{b.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      'data-num text-sm',
                      b.type === 'income' ? 'text-chart-4' : 'text-destructive',
                    )}
                  >
                    {b.type === 'income' ? '+ ' : '− '}
                    {formatBRL(b.amount)}
                  </span>
                  <button
                    onClick={() => onDelete(b)}
                    aria-label={`Remover previsão de ${b.category}`}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
