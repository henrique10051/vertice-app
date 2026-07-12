import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Trash2, ShoppingCart, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/services/inventory'

type InventoryItemCardProps = {
  item: InventoryItem
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void
  onDelete: (id: string) => void
}

export function InventoryItemCard({ item, onUpdate, onDelete }: InventoryItemCardProps) {
  const isLowStock = Number(item.current_quantity) <= Number(item.min_quantity)

  const handleIncrement = () =>
    onUpdate(item.id, { current_quantity: Number(item.current_quantity) + 1 })

  const handleDecrement = () => {
    if (Number(item.current_quantity) > 0)
      onUpdate(item.id, { current_quantity: Number(item.current_quantity) - 1 })
  }

  return (
    <Card
      className={cn(
        'glass-card border-none rounded-2xl overflow-hidden transition-all',
        isLowStock && 'ring-2 ring-rose-500/50',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">{item.name}</h3>
              {isLowStock && (
                <Badge variant="destructive" className="text-xs shrink-0">
                  Comprar
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.category} · {item.current_quantity}/{item.min_quantity} {item.unit}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleDecrement}
            >
              <Minus size={14} />
            </Button>
            <span className="w-8 text-center font-bold tabular-nums">{item.current_quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleIncrement}
            >
              <Plus size={14} />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={item.is_on_shopping_list ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 rounded-lg shrink-0"
              onClick={() => onUpdate(item.id, { is_on_shopping_list: !item.is_on_shopping_list })}
            >
              {item.is_on_shopping_list ? <Check size={14} /> : <ShoppingCart size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 shrink-0"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
