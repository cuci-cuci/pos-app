import type { CartItem } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/format'
import { Trash } from 'lucide-react'

interface CartItemRowProps {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

export function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const step = item.unit === 'kg' ? 0.5 : 1

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{item.serviceName}</p>
        <p className="text-xs text-muted-foreground">{item.categoryName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatCurrency(item.pricePerUnit)} x {item.quantity} = {formatCurrency(item.subtotal)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - step)}
            className="w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold active:bg-accent touch-manipulation"
          >
            -
          </button>
          <span className="text-sm font-medium min-w-[40px] text-center">
            {item.quantity} {item.unit}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + step)}
            className="w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold active:bg-accent touch-manipulation"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold">{formatCurrency(item.subtotal)}</span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Hapus item"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  )
}
