import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

type LowStockItem = {
  id: string
  name: string
  current_quantity: number | null
  min_quantity: number | null
  unit: string | null
}

export function InventoryStatus({ items }: { items: LowStockItem[] }) {
  return (
    <Card className="glass-card rounded-2xl border-none shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Package className="text-amber-500" /> Estoque Baixo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.current_quantity} / {item.min_quantity} {item.unit}
                </span>
              </div>
            ))}
            {items.length > 5 && (
              <Link
                to="/mercado"
                className="block text-center text-sm text-primary hover:underline mt-2"
              >
                Ver todos ({items.length})
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Tudo abastecido!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
