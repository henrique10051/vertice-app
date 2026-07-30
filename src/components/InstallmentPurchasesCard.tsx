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
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { formatBRL } from '@/lib/currency'
import { useToast } from '@/hooks/use-toast'
import useFinancesStore from '@/stores/useFinancesStore'
import type { InstallmentPurchase } from '@/stores/useFinancesStore'

function nextMonthKey() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Which future month (1-based, relative to nextMonthKey()) this purchase still charges — or null if already finished. */
function remainingLabel(p: InstallmentPurchase) {
  const [ny, nm] = nextMonthKey().split('-').map(Number)
  const [sy, sm] = p.start_month.slice(0, 7).split('-').map(Number)
  const idx = (ny - sy) * 12 + (nm - sm) + 1 // installment number due next month
  if (idx > p.installments_total) return null
  const remaining = p.installments_total - Math.max(idx, 1) + 1
  return { current: Math.max(idx, 1), remaining }
}

export function InstallmentPurchasesCard() {
  const { installmentPurchases, financeCategories, addInstallmentPurchase, deleteInstallmentPurchase } =
    useFinancesStore()
  const { toast } = useToast()
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentsCount, setInstallmentsCount] = useState('')
  const [startMonth, setStartMonth] = useState(nextMonthKey())
  const [saving, setSaving] = useState(false)

  const cat = category || financeCategories[0] || ''
  const n = Number(installmentsCount)
  const installmentAmount = n > 0 && totalAmount ? Number(totalAmount) / n : 0

  const active = useMemo(() => {
    return installmentPurchases
      .map((p) => ({ purchase: p, info: remainingLabel(p) }))
      .filter((x) => x.info !== null)
      .sort((a, b) => a.purchase.start_month.localeCompare(b.purchase.start_month))
  }, [installmentPurchases])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !cat || !totalAmount || !n || n < 1) return
    setSaving(true)
    await addInstallmentPurchase({
      description,
      category: cat,
      total_amount: Number(totalAmount),
      installments_total: n,
      installment_amount: Math.round(installmentAmount * 100) / 100,
      start_month: `${startMonth}-01`,
    })
    setSaving(false)
    toast({ title: 'Compra parcelada cadastrada', description: `${description} — ${n}x` })
    setDescription('')
    setTotalAmount('')
    setInstallmentsCount('')
  }

  const handleDelete = async (p: InstallmentPurchase) => {
    await deleteInstallmentPurchase(p.id)
    toast({ title: 'Compra parcelada removida', description: p.description })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight">Compras a Prazo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadastre uma vez e a parcela entra sozinha na previsão de cada mês, até o fim do
            parcelamento.
          </p>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input
                  placeholder="Ex: Notebook, Sofá..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor total</Label>
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
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="12"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">1ª parcela em</Label>
                <Input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={saving || !description || !cat || !n} className="gap-1.5">
                <Plus size={16} /> Adicionar
              </Button>
            </div>

            {installmentAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {n}x de{' '}
                <span className="data-num font-medium text-foreground">
                  {formatBRL(installmentAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {active.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="p-10 flex flex-col items-center text-center gap-1">
            <p className="text-sm font-medium">Nenhuma compra parcelada ativa</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Cadastre uma compra a prazo acima — ela some da lista sozinha quando a última
              parcela for paga.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg">
          <CardContent className="p-5 space-y-1">
            {active.map(({ purchase, info }) => (
              <div
                key={purchase.id}
                className="group flex items-center justify-between rounded-md px-2 py-2.5 -mx-2 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{purchase.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.category} · parcela {info!.current}/{purchase.installments_total}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="data-num text-sm text-destructive">
                    − {formatBRL(purchase.installment_amount)}
                    <span className="text-muted-foreground">/mês</span>
                  </span>
                  <button
                    onClick={() => handleDelete(purchase)}
                    aria-label={`Remover compra parcelada ${purchase.description}`}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
