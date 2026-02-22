import { useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/format'
import { CartItemRow } from './cart-item-row'
import { CustomerSearch } from '@/components/customer/customer-search'
import { PaymentDialog } from '@/components/payment/payment-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash, CaretDown, CaretUp } from '@phosphor-icons/react'
import { EmptyState } from '@/components/shared/empty-state'

export function CartPanel() {
  const {
    items,
    discountPercent,
    notes,
    removeItem,
    updateQuantity,
    setDiscount,
    setNotes,
    clear,
    getSubtotal,
    getTotal,
  } = useCartStore()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)

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
      {/* Header */}
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

      {/* Customer section */}
      <div className="px-4 py-3">
        <CustomerSearch />
      </div>

      <Separator />

      {/* Item list */}
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

      {/* Notes (collapsible) */}
      <div className="px-4 py-2 border-t border-[var(--border)]">
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] w-full"
        >
          {notesExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          <span>Catatan pesanan</span>
          {notes && !notesExpanded && (
            <span className="text-xs text-[var(--primary)] ml-auto truncate max-w-[120px]">{notes}</span>
          )}
        </button>
        {notesExpanded && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan pesanan..."
            className="mt-2 w-full rounded-[var(--radius)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        )}
      </div>

      {/* Price breakdown */}
      <div className="border-t border-[var(--border)] p-4 space-y-2">
        {/* Discount input */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">Diskon</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={discountPercent || ''}
            onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            placeholder="0"
            className="h-8 w-16 text-center text-sm"
          />
          <span className="text-sm text-[var(--muted-foreground)]">%</span>
        </div>

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

        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Pajak</span>
          <span>Rp 0</span>
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <Button
          size="lg"
          className="w-full mt-2 text-base font-bold h-12"
          onClick={() => setPaymentOpen(true)}
        >
          Bayar &middot; {formatCurrency(total)}
        </Button>
      </div>

      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  )
}
