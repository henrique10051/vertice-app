import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInventory } from '@/hooks/use-inventory'
import { Plus } from 'lucide-react'

const CATEGORIES = ['Alimentação', 'Limpeza', 'Higiene', 'Geral']
const UNITS = ['un', 'kg', 'litro', 'pacote', 'caixa']

export function InventoryAddDialog({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (v: boolean) => void
}) {
  const { addItem } = useInventory()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Alimentação')
  const [currentQty, setCurrentQty] = useState('1')
  const [minQty, setMinQty] = useState('1')
  const [unit, setUnit] = useState('un')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await addItem({
      name: name.trim(),
      category,
      current_quantity: Number(currentQty) || 0,
      min_quantity: Number(minQty) || 1,
      unit,
    })
    setSaving(false)
    setName('')
    setCurrentQty('1')
    setMinQty('1')
    setUnit('un')
    setCategory('Alimentação')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-none glass-card rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Arroz" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Qtd. Atual</Label>
              <Input
                type="number"
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Mínima</Label>
              <Input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()} className="gap-2">
            <Plus size={18} /> {saving ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
