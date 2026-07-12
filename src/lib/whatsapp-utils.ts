import type { InventoryItem } from '@/services/inventory'

export function formatShoppingList(items: InventoryItem[]): string {
  const lowStockItems = items.filter(
    (item) => Number(item.current_quantity ?? 0) <= Number(item.min_quantity ?? 1),
  )
  if (lowStockItems.length === 0) return ''

  const lines = lowStockItems.map((item) => {
    const qty = item.current_quantity ?? 0
    const unit = item.unit || 'un'
    return `- ${item.name} (${qty} ${unit})`
  })

  return `*Lista de Compras:*\n${lines.join('\n')}`
}

export function shareViaWhatsApp(items: InventoryItem[]): void {
  const text = formatShoppingList(items)
  if (!text) return
  const encoded = encodeURIComponent(text)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
}
