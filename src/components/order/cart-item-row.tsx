import type { CartItem } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/format'
import { X } from '@phosphor-icons/react'

interface CartItemRowProps {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

export function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.serviceName}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{item.categoryName}</p>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - (item.unit === 'kg' ? 0.5 : 1))}
            className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-sm font-bold active:bg-[var(--accent)]"
          >
            -
          </button>
          <span className="text-sm font-medium min-w-[40px] text-center">
            {item.quantity} {item.unit}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + (item.unit === 'kg' ? 0.5 : 1))}
            className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-sm font-bold active:bg-[var(--accent)]"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold">{formatCurrency(item.subtotal)}</span>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-full hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
          aria-label="Hapus item"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
