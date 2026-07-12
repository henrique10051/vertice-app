import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InventoryItemCard } from '@/components/InventoryItemCard'
import { InventoryAddDialog } from '@/components/InventoryAddDialog'
import { useInventory } from '@/hooks/use-inventory'
import { Plus, ArrowLeft, ShoppingCart, Package, AlertTriangle, MessageCircle } from 'lucide-react'
import { InventoryTodoList } from '@/components/InventoryTodoList'

export default function Mercado() {
  const { items, loading, updateItem, removeItem } = useInventory()
  const [addOpen, setAddOpen] = useState(false)
  const [view, setView] = useState<'all' | 'shopping'>('all')

  const shoppingItems = items.filter(
    (item) =>
      item.is_on_shopping_list || Number(item.current_quantity) <= Number(item.min_quantity),
  )
  const displayedItems = view === 'all' ? items : shoppingItems

  const handleExportWhatsApp = () => {
    const itemsToBuy = items.filter(
      (item) =>
        item.is_on_shopping_list || Number(item.current_quantity) <= Number(item.min_quantity),
    )

    if (itemsToBuy.length === 0) {
      return
    }

    const lines = itemsToBuy.map((item) => {
      const qty = Math.max(Number(item.min_quantity) - Number(item.current_quantity), 1)
      return `- ${qty}x ${item.name}`
    })

    const message = `*Lista de Compras:*\n${lines.join('\n')}`
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShoppingCart className="text-primary" size={28} />
            </div>
            Mercado
          </h1>
          <p className="text-muted-foreground">Controle seu estoque e lista de compras.</p>
        </div>
        <div className="flex gap-2">
          {shoppingItems.length > 0 && (
            <Button
              onClick={handleExportWhatsApp}
              variant="outline"
              className="rounded-xl gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-700"
            >
              <MessageCircle size={18} /> WhatsApp
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)} className="rounded-xl gap-2">
            <Plus size={18} /> Adicionar Item
          </Button>
        </div>
      </div>

      {shoppingItems.length > 0 && (
        <Card className="glass-card rounded-2xl border-none bg-rose-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="text-rose-500 shrink-0" size={20} />
            <p className="text-sm">
              <strong>{shoppingItems.length}</strong> item(ns) precisam ser comprados.
            </p>
          </CardContent>
        </Card>
      )}

      <InventoryTodoList />

      <div className="flex gap-2">
        <Button
          variant={view === 'all' ? 'default' : 'outline'}
          onClick={() => setView('all')}
          className="rounded-xl"
        >
          <Package size={16} className="mr-1" /> Estoque ({items.length})
        </Button>
        <Button
          variant={view === 'shopping' ? 'default' : 'outline'}
          onClick={() => setView('shopping')}
          className="rounded-xl"
        >
          <ShoppingCart size={16} className="mr-1" /> Compras ({shoppingItems.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Package className="animate-pulse text-primary" size={32} />
        </div>
      ) : displayedItems.length === 0 ? (
        <Card className="glass-card rounded-2xl border-none">
          <CardContent className="p-12 text-center">
            <Package className="mx-auto text-muted-foreground mb-3" size={40} />
            <p className="text-muted-foreground">
              {view === 'all' ? 'Nenhum item no estoque.' : 'Lista de compras vazia.'}
            </p>
            <Button
              onClick={() => setAddOpen(true)}
              variant="outline"
              className="mt-4 rounded-xl gap-2"
            >
              <Plus size={16} /> Adicionar item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {displayedItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onDelete={removeItem}
            />
          ))}
        </div>
      )}

      <InventoryAddDialog open={addOpen} setOpen={setAddOpen} />
    </div>
  )
}
