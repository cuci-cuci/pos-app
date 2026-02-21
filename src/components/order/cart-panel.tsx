import { useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/format'
import { CartItemRow } from './cart-item-row'
import { PaymentDialog } from '@/components/payment/payment-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash } from '@phosphor-icons/react'
import { EmptyState } from '@/components/shared/empty-state'

export function CartPanel() {
  const { items, discountPercent, removeItem, updateQuantity, clear, getSubtotal, getTotal } =
    useCartStore()
  const [paymentOpen, setPaymentOpen] = useState(false)

  const subtotal = getSubtotal()
  const total = getTotal()
  const discountAmount = Math.round(subtotal * (discountPercent / 100))

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="Keranjang kosong"
          description="Pilih layanan untuk memulai transaksi"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold text-base">
          Keranjang ({items.length})
        </h2>
        <button
          onClick={clear}
          className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] p-2 rounded-lg"
          aria-label="Kosongkan keranjang"
        >
          <Trash size={20} />
        </button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-4 divide-y divide-[var(--border)]">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Diskon ({discountPercent}%)</span>
            <span className="text-[var(--destructive)]">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <Button
          size="lg"
          className="w-full mt-2 text-base font-bold h-14"
          onClick={() => setPaymentOpen(true)}
        >
          Bayar {formatCurrency(total)}
        </Button>
      </div>

      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  )
}
