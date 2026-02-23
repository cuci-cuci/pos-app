import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  CloudCheck,
  CloudSlash,
  Prohibit,
  Receipt,
  XCircle,
} from '@phosphor-icons/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { TransactionActions } from '@/components/receipt/transaction-actions'
import { TransactionReceipt } from '@/components/receipt/transaction-receipt'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/components/ui/toast'
import { db } from '@/db'
import type { SyncStatus, TransactionStatus } from '@/db/schema'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart-store'
import { useShiftStore } from '@/stores/shift-store'

function statusLabel(status: TransactionStatus) {
  switch (status) {
    case 'completed':
      return {
        label: 'Lunas',
        variant: 'success' as const,
        icon: CheckCircle,
        weight: 'fill' as const,
      }
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: XCircle,
        weight: 'fill' as const,
      }
    case 'refunded':
      return {
        label: 'Refund',
        variant: 'secondary' as const,
        icon: ArrowsClockwise,
        weight: 'bold' as const,
      }
  }
}

function syncStatusInfo(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return {
        label: 'Tersinkron',
        color: 'text-success',
        icon: CloudCheck,
        weight: 'fill' as const,
      }
    case 'pending':
      return {
        label: 'Menunggu sinkronisasi',
        color: 'text-muted-foreground',
        icon: Clock,
        weight: 'fill' as const,
      }
    case 'syncing':
      return {
        label: 'Sedang sinkronisasi...',
        color: 'text-primary',
        icon: ArrowsClockwise,
        weight: 'bold' as const,
      }
    case 'failed':
      return {
        label: 'Gagal sinkron',
        color: 'text-destructive',
        icon: CloudSlash,
        weight: 'fill' as const,
      }
  }
}

export function TransactionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const router = useRouter()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const { currentShift } = useShiftStore()

  const transaction = useLiveQuery(() => db.transactions.get(id), [id])

  if (transaction === undefined) {
    return <DetailSkeleton />
  }

  if (!transaction) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/transactions' })}
        >
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <EmptyState
          icon={<Receipt size={48} weight="fill" />}
          title="Transaksi tidak ditemukan"
          description="Transaksi yang Anda cari tidak ada di database lokal."
        />
      </div>
    )
  }

  const status = statusLabel(transaction.status)
  const sync = syncStatusInfo(transaction.syncStatus)
  const StatusIcon = status.icon
  const SyncIcon = sync.icon
  const payment = transaction.payments[0]

  const isSameShiftOrToday =
    (currentShift && transaction.shiftId === currentShift.id) ||
    new Date(transaction.createdAt).toDateString() === new Date().toDateString()

  const canCancel = transaction.status === 'completed' && isSameShiftOrToday
  const canRefund = transaction.status === 'completed' && !isSameShiftOrToday

  const handleCancelTransaction = async () => {
    setIsCancelling(true)
    try {
      await db.transactions.update(transaction.id, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        syncStatus: transaction.syncStatus === 'synced' ? 'pending' : transaction.syncStatus,
      })
      showToast('Transaksi berhasil dibatalkan', 'success')
      setShowCancelConfirm(false)
    } catch {
      showToast('Gagal membatalkan transaksi', 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRefundTransaction = async () => {
    setIsRefunding(true)
    try {
      await db.transactions.update(transaction.id, {
        status: 'refunded',
        updatedAt: new Date().toISOString(),
        syncStatus: transaction.syncStatus === 'synced' ? 'pending' : transaction.syncStatus,
      })
      showToast('Transaksi berhasil di-refund', 'success')
      setShowRefundConfirm(false)
    } catch {
      showToast('Gagal melakukan refund', 'error')
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/transactions' })}
        >
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <h1 className="text-lg font-semibold">Detail Transaksi</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        <div className="max-w-md mx-auto space-y-3">
          {/* Cancelled banner */}
          {transaction.status === 'cancelled' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] p-3 text-center">
              <p className="text-destructive font-bold text-sm">TRANSAKSI DIBATALKAN</p>
              <p className="text-xs text-muted-foreground mt-1">
                Transaksi ini telah dibatalkan dan tidak dihitung dalam laporan.
              </p>
            </div>
          )}

          {/* Refunded banner */}
          {transaction.status === 'refunded' && (
            <div className="bg-muted border rounded-[var(--radius)] p-3 text-center">
              <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                <ArrowsClockwise size={16} weight="bold" />
                TRANSAKSI DI-REFUND
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Transaksi ini telah di-refund dan tidak dihitung dalam laporan.
              </p>
            </div>
          )}

          {/* Info card */}
          <div className="bg-card border rounded-[var(--radius)] p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono font-semibold text-base">#{transaction.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}
                </p>
              </div>
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon size={12} weight={status.weight} />
                {status.label}
              </Badge>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium">{transaction.customerName}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              <SyncIcon
                size={14}
                weight={sync.weight}
                className={cn(sync.color, transaction.syncStatus === 'syncing' && 'animate-spin')}
              />
              <span className={cn('text-xs', sync.color)}>{sync.label}</span>
            </div>
          </div>

          {/* Items card */}
          <div className="bg-card border rounded-[var(--radius)] p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Item</p>
            <div className="space-y-2.5">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.serviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} x {formatCurrency(item.pricePerUnit)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown card */}
          <div className="bg-card border rounded-[var(--radius)] p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Rincian</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Diskon ({transaction.discountPercent}%)
                </span>
                <span className="text-success">-{formatCurrency(transaction.discountAmount)}</span>
              </div>
            )}
            {transaction.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pajak ({transaction.taxRate}%)</span>
                <span>{formatCurrency(transaction.taxAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(transaction.totalAmount)}</span>
            </div>
          </div>

          {/* Payment card */}
          {payment && (
            <div className="bg-card border rounded-[var(--radius)] p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Pembayaran
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-medium">{payment.methodName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jumlah Dibayar</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              {payment.cashTendered != null && payment.cashTendered > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uang Diterima</span>
                  <span>{formatCurrency(payment.cashTendered)}</span>
                </div>
              )}
              {payment.changeAmount != null && payment.changeAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span>{formatCurrency(payment.changeAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-card border rounded-[var(--radius)] p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan</p>
              <p className="text-sm">{transaction.notes}</p>
            </div>
          )}

          {/* Actions: Print & Share */}
          <TransactionActions transaction={transaction} />

          {/* Repeat order button */}
          {transaction.status !== 'cancelled' && (
            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={() => {
                const cart = useCartStore.getState()
                cart.clear()
                for (const item of transaction.items) {
                  cart.addItem({
                    serviceId: item.serviceId,
                    serviceName: item.serviceName,
                    categoryName: item.categoryName,
                    unit: item.unit,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                  })
                }
                if (transaction.customerName) {
                  cart.setCustomer(transaction.customerId ?? null, transaction.customerName)
                }
                void router.navigate({ to: '/' })
              }}
            >
              <ArrowCounterClockwise size={18} weight="bold" />
              Ulangi Pesanan
            </Button>
          )}

          {/* Cancel button */}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              onClick={() => setShowCancelConfirm(true)}
            >
              <Prohibit size={18} weight="fill" />
              Batalkan Transaksi
            </Button>
          )}

          {/* Refund button */}
          {canRefund && (
            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={() => setShowRefundConfirm(true)}
            >
              <ArrowsClockwise size={18} weight="bold" />
              Refund Transaksi
            </Button>
          )}
        </div>
      </div>

      {/* Hidden receipt for printing */}
      <div className="receipt-printable hidden">
        <TransactionReceipt transaction={transaction} />
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-[var(--radius)] p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Prohibit size={20} className="text-destructive" weight="fill" />
              </div>
              <h3 className="text-lg font-bold">Batalkan Transaksi?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Transaksi{' '}
              <span className="font-semibold text-foreground">#{transaction.orderNumber}</span>{' '}
              senilai{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(transaction.totalAmount)}
              </span>{' '}
              akan dibatalkan.
            </p>
            <p className="text-sm text-destructive mb-4">Tindakan ini tidak dapat dikembalikan.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
              >
                Kembali
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => void handleCancelTransaction()}
                disabled={isCancelling}
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund confirmation dialog */}
      {showRefundConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-[var(--radius)] p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ArrowsClockwise size={20} weight="bold" />
              </div>
              <h3 className="text-lg font-bold">Refund Transaksi?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Transaksi{' '}
              <span className="font-semibold text-foreground">#{transaction.orderNumber}</span>{' '}
              senilai{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(transaction.totalAmount)}
              </span>{' '}
              akan di-refund.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Dana harus dikembalikan ke pelanggan secara manual.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRefundConfirm(false)}
                disabled={isRefunding}
              >
                Kembali
              </Button>
              <Button
                className="flex-1"
                onClick={() => void handleRefundTransaction()}
                disabled={isRefunding}
              >
                {isRefunding ? 'Memproses...' : 'Ya, Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
