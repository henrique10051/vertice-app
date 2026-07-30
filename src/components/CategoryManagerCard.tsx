import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancesStore from '@/stores/useFinancesStore'

export function CategoryManagerCard() {
  const { financeCategories, addFinanceCategory, deleteFinanceCategory } = useFinancesStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (financeCategories.includes(trimmed)) {
      toast({ title: 'Categoria já existe', description: trimmed, variant: 'destructive' })
      return
    }
    setSaving(true)
    await addFinanceCategory(trimmed)
    setSaving(false)
    setName('')
  }

  const handleDelete = async (c: string) => {
    await deleteFinanceCategory(c)
    toast({ title: 'Categoria removida', description: c })
  }

  return (
    <Card className="rounded-lg">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0">
            <Tag size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight">Categorias</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usadas em transações, previsões e compras a prazo.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <Input
            placeholder="Nova categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={saving || !name.trim()} className="shrink-0">
            <Plus size={16} />
          </Button>
        </form>

        {financeCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {financeCategories.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 text-xs bg-muted rounded-full pl-3 pr-2 py-1.5 text-muted-foreground"
              >
                {c}
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  aria-label={`Remover categoria ${c}`}
                  className="hover:text-destructive transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
