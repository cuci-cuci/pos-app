import { CaretDown, CaretUp, Crown, ShoppingCart, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { CustomerSearch } from '@/components/customer/customer-search'
import { PaymentDialog } from '@/components/payment/payment-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { db } from '@/db'
import type { Transaction } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/stores/cart-store'
import { CartItemRow } from './cart-item-row'

interface CartPanelProps {
  onTransactionComplete?: (tx: Transaction) => void
}

export function CartPanel({ onTransactionComplete }: CartPanelProps = {}) {
  const {
    items,
    discountPercent,
    memberInfo,
    notes,
    customerPhone,
    estimatedDurationHours,
    removeItem,
    updateQuantity,
    setDiscount,
    setNotes,
    setCustomerPhone,
    setEstimatedDuration,
    clear,
    getSubtotal,
  } = useCartStore()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [orderDetailsExpanded, setOrderDetailsExpanded] = useState(false)

  const tenantConfig = useLiveQuery(() => db.tenantConfig.toCollection().first())

  const subtotal = getSubtotal()
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const taxRate = tenantConfig?.taxRate ?? 0
  const taxAmount = Math.round(((subtotal - discountAmount) * taxRate) / 100)
  const total = subtotal - discountAmount + taxAmount

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center p-4">
        <EmptyState
          icon={<ShoppingCart size={40} weight="fill" />}
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
        <h2 className="font-semibold text-base">Keranjang ({items.length})</h2>
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-destructive p-2 rounded-lg"
          aria-label="Kosongkan keranjang"
        >
          <Trash size={20} weight="fill" />
        </button>
      </div>

      <Separator />

      {/* Customer section */}
      <div className="px-4 py-3">
        <CustomerSearch />
      </div>

      <Separator />

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 divide-y divide-border">
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
      <div className="px-4 py-2 border-t border-border">
        <button
          type="button"
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground w-full"
        >
          {notesExpanded ? (
            <CaretUp size={14} weight="bold" />
          ) : (
            <CaretDown size={14} weight="bold" />
          )}
          <span>Catatan pesanan</span>
          {notes && !notesExpanded && (
            <span className="text-xs text-primary ml-auto truncate max-w-[120px]">{notes}</span>
          )}
        </button>
        {notesExpanded && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan pesanan..."
            className="mt-2 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>

      {/* Order details (collapsible) */}
      <div className="px-4 py-2 border-t border-border">
        <button
          type="button"
          onClick={() => setOrderDetailsExpanded(!orderDetailsExpanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground w-full"
        >
          {orderDetailsExpanded ? (
            <CaretUp size={14} weight="bold" />
          ) : (
            <CaretDown size={14} weight="bold" />
          )}
          <span>Detail pesanan</span>
          {(customerPhone || estimatedDurationHours) && !orderDetailsExpanded && (
            <span className="text-xs text-primary ml-auto">Diisi</span>
          )}
        </button>
        {orderDetailsExpanded && (
          <div className="mt-2 space-y-2">
            <div>
              <label htmlFor="customer-phone" className="text-xs text-muted-foreground mb-1 block">
                No. Telepon Pelanggan
              </label>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label htmlFor="estimated-duration" className="text-xs text-muted-foreground mb-1 block">
                Estimasi selesai (jam, opsional)
              </label>
              <Input
                id="estimated-duration"
                type="number"
                inputMode="numeric"
                min={1}
                max={72}
                placeholder="Otomatis"
                value={estimatedDurationHours ?? ''}
                onChange={(e) =>
                  setEstimatedDuration(e.target.value ? Number(e.target.value) : null)
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="border-t border-border p-4 space-y-2">
        {/* Discount input */}
        {memberInfo ? (
          <div className="flex items-center gap-2 text-sm">
            <Crown size={14} weight="fill" className="text-primary" />
            <span className="text-primary font-medium">
              Diskon Member ({memberInfo.tier.charAt(0).toUpperCase() + memberInfo.tier.slice(1)})
            </span>
            <span className="ml-auto font-semibold text-primary">{discountPercent}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Diskon</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={discountPercent || ''}
              onChange={(e) =>
                setDiscount(Math.min(100, Math.max(0, Number.parseInt(e.target.value, 10) || 0)))
              }
              placeholder="0"
              className="h-8 w-16 text-center text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discountPercent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {memberInfo ? `Diskon Member (${discountPercent}%)` : `Diskon (${discountPercent}%)`}
            </span>
            <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pajak{taxRate > 0 ? ` (${taxRate}%)` : ''}</span>
          <span>{formatCurrency(taxAmount)}</span>
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

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onTransactionComplete={onTransactionComplete}
      />
    </div>
  )
}
