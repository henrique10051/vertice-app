import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ListChecks, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useInventory } from '@/hooks/use-inventory'
import { cn } from '@/lib/utils'

export function InventoryTodoList() {
  const { items, updateItem } = useInventory()

  const lowStockItems = items.filter(
    (item) => Number(item.current_quantity) <= Number(item.min_quantity),
  )

  const handleCheck = (itemId: string, checked: boolean) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    if (checked) {
      updateItem(itemId, {
        current_quantity: Number(item.min_quantity) + 1,
        is_on_shopping_list: false,
      })
    } else {
      updateItem(itemId, { is_on_shopping_list: true })
    }
  }

  if (lowStockItems.length === 0) {
    return (
      <Card className="glass-card rounded-2xl border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="text-primary" size={20} />
            Lista de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col items-center gap-2 py-4">
            <ShoppingBag className="text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">
              Tudo em ordem! Nenhum item precisa ser comprado.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card rounded-2xl border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="text-primary" size={20} />
          Lista de Compras
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {lowStockItems.length} item(ns)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {lowStockItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox onCheckedChange={(checked) => handleCheck(item.id, checked === true)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.category} · Atual: {item.current_quantity} / Mín: {item.min_quantity}{' '}
                {item.unit}
              </p>
            </div>
            <button
              onClick={() =>
                updateItem(item.id, { is_on_shopping_list: !item.is_on_shopping_list })
              }
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-colors',
                item.is_on_shopping_list
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
