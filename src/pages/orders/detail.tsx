import { ArrowCounterClockwise, ArrowLeft } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { ReceiptActions } from '@/components/receipt/receipt-actions'
import { ReceiptTemplate } from '@/components/receipt/receipt-template'
import { InlineError } from '@/components/shared/inline-error'
import { DetailSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderDetail, OrderStatus } from '@/services/order-api'
import { orderApi } from '@/services/order-api'
import { useCartStore } from '@/stores/cart-store'

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  received: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  washing: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  drying: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  ironing: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  done: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  picked_up: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

const statusLabels: Record<OrderStatus, string> = {
  received: 'Diterima',
  washing: 'Cuci',
  drying: 'Kering',
  ironing: 'Setrika',
  done: 'Selesai',
  picked_up: 'Diambil',
  cancelled: 'Batal',
}

const timelineDotColors: Record<OrderStatus, string> = {
  received: 'bg-blue-500',
  washing: 'bg-cyan-500',
  drying: 'bg-amber-500',
  ironing: 'bg-purple-500',
  done: 'bg-emerald-500',
  picked_up: 'bg-gray-500',
  cancelled: 'bg-red-500',
}

interface StatusAction {
  label: string
  nextStatus: OrderStatus
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
}

function getStatusActions(status: OrderStatus): StatusAction[] {
  switch (status) {
    case 'received':
      return [{ label: 'Mulai Cuci', nextStatus: 'washing', variant: 'default' }]
    case 'washing':
      return [
        { label: 'Pengeringan', nextStatus: 'drying', variant: 'default' },
        { label: 'Setrika', nextStatus: 'ironing', variant: 'secondary' },
      ]
    case 'drying':
      return [
        { label: 'Setrika', nextStatus: 'ironing', variant: 'default' },
        { label: 'Selesai', nextStatus: 'done', variant: 'secondary' },
      ]
    case 'ironing':
      return [{ label: 'Selesai', nextStatus: 'done', variant: 'default' }]
    case 'done':
      return [{ label: 'Sudah Diambil', nextStatus: 'picked_up', variant: 'default' }]
    default:
      return []
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = statusColors[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colors.bg,
        colors.text,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export function OrderDetailPage() {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Extract order ID from URL path
  const orderId = window.location.pathname.split('/orders/')[1] ?? ''

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      setError(false)
      const response = await orderApi.getById(orderId)
      setOrder(response.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void fetchOrder()
  }, [fetchOrder])

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!order) return
    setUpdating(true)
    try {
      await orderApi.updateStatus(order.id, { status: nextStatus })
      await fetchOrder()
    } catch {
      // handle error silently
    } finally {
      setUpdating(false)
      setConfirmAction(null)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    setUpdating(true)
    try {
      await orderApi.updateStatus(order.id, {
        status: 'cancelled',
        notes: 'Dibatalkan oleh kasir',
      })
      await fetchOrder()
    } catch {
      // handle error silently
    } finally {
      setUpdating(false)
      setShowCancelConfirm(false)
    }
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <InlineError
          message={error ? 'Gagal memuat pesanan.' : 'Pesanan tidak ditemukan.'}
          onRetry={error ? fetchOrder : undefined}
        />
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => router.navigate({ to: '/orders' })}
        >
          Kembali ke Pesanan
        </Button>
      </div>
    )
  }

  const actions = getStatusActions(order.status)
  const canCancel = order.status !== 'picked_up' && order.status !== 'cancelled'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.navigate({ to: '/orders' })}
          className="p-1.5 rounded-[var(--radius)] hover:bg-muted transition-colors touch-manipulation"
        >
          <ArrowLeft size={22} weight="bold" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">#{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {/* Customer & amount */}
        <div className="bg-card border rounded-[var(--radius)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pelanggan</p>
              <p className="text-sm font-semibold mt-0.5">{order.customer_name || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold mt-0.5">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.transaction && (
          <div className="bg-card border rounded-[var(--radius)] p-4">
            <h2 className="text-sm font-semibold mb-3">Item Pesanan</h2>
            <div className="space-y-2">
              {order.transaction.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-3 pt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.transaction.subtotal)}</span>
              </div>
              {order.transaction.discount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Diskon</span>
                  <span>-{formatCurrency(order.transaction.discount)}</span>
                </div>
              )}
              {order.transaction.tax > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pajak</span>
                  <span>{formatCurrency(order.transaction.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.transaction.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {order.status_logs && order.status_logs.length > 0 && (
          <div className="bg-card border rounded-[var(--radius)] p-4">
            <h2 className="text-sm font-semibold mb-3">Riwayat Status</h2>
            <div className="relative">
              {order.status_logs.map((log, index) => {
                const isLast = index === order.status_logs.length - 1
                const dotColor = timelineDotColors[log.status as OrderStatus] ?? 'bg-gray-400'

                return (
                  <div key={log.id} className="flex gap-3">
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={cn('w-3 h-3 rounded-full shrink-0 mt-0.5', dotColor)} />
                      {!isLast && <div className="w-0.5 flex-1 bg-border min-h-[24px]" />}
                    </div>

                    {/* Content */}
                    <div className={cn('pb-4', isLast && 'pb-0')}>
                      <p className="text-sm font-medium">
                        {statusLabels[log.status as OrderStatus] ?? log.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)} {formatTime(log.created_at)}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                      )}
                      {log.created_by_name && (
                        <p className="text-xs text-muted-foreground">oleh {log.created_by_name}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Receipt */}
        <ReceiptTemplate order={order} />

        {/* Receipt actions */}
        <ReceiptActions order={order} />

        {/* Repeat order button */}
        {order.transaction && order.status !== 'cancelled' && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={async () => {
              const cart = useCartStore.getState()
              cart.clear()
              const allServices = await db.services.toArray()
              const allCategories = await db.serviceCategories.toArray()
              for (const item of order.transaction.items) {
                const match = allServices.find((s) => s.name === item.service_name)
                const category = match ? allCategories.find((c: { id: string }) => c.id === match.categoryId) : null
                cart.addItem({
                  serviceId: match?.id ?? item.id,
                  serviceName: item.service_name,
                  categoryName: category?.name ?? '',
                  unit: item.unit,
                  quantity: item.quantity,
                  pricePerUnit: item.price,
                })
              }
              if (order.customer_name) {
                cart.setCustomer(null, order.customer_name)
              }
              void router.navigate({ to: '/' })
            }}
          >
            <ArrowCounterClockwise size={18} weight="bold" />
            Ulangi Pesanan
          </Button>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="space-y-2">
            {actions.map((action) => (
              <Button
                key={action.nextStatus}
                variant={action.variant}
                className="w-full"
                size="lg"
                disabled={updating}
                onClick={() => setConfirmAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive"
            disabled={updating}
            onClick={() => setShowCancelConfirm(true)}
          >
            Batalkan Pesanan
          </Button>
        )}
      </div>

      {/* Confirmation dialog for status change */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmAction(null)}
            aria-label="Tutup dialog"
          />
          <div className="relative bg-card rounded-[var(--radius)] p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-base font-bold mb-2">Konfirmasi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ubah status pesanan ke &quot;{confirmAction.label}&quot;?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmAction(null)}
                disabled={updating}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleStatusUpdate(confirmAction.nextStatus)}
                disabled={updating}
              >
                {updating ? 'Memproses...' : 'Ya, Ubah'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog for cancel */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelConfirm(false)}
            aria-label="Tutup dialog"
          />
          <div className="relative bg-card rounded-[var(--radius)] p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-base font-bold mb-2">Batalkan Pesanan?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pesanan yang dibatalkan tidak dapat dikembalikan. Lanjutkan?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
                disabled={updating}
              >
                Tidak
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => void handleCancel()}
                disabled={updating}
              >
                {updating ? 'Memproses...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
