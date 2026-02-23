import { useParams, useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Prohibit,
  CheckCircle,
  Clock,
  CloudCheck,
  CloudSlash,
  Receipt,
  ArrowsClockwise,
  XCircle,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { ReceiptActions } from '@/components/receipt/receipt-actions'
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
import type { OrderDetail } from '@/services/order-api'
import { useShiftStore } from '@/stores/shift-store'

function statusLabel(status: TransactionStatus) {
  switch (status) {
    case 'completed':
      return { label: 'Selesai', variant: 'success' as const, icon: CheckCircle, weight: 'fill' as const }
    case 'cancelled':
      return { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle, weight: 'fill' as const }
    case 'refunded':
      return { label: 'Refund', variant: 'secondary' as const, icon: ArrowsClockwise, weight: 'bold' as const }
  }
}

function syncStatusInfo(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return { label: 'Tersinkron', color: 'text-success', icon: CloudCheck, weight: 'fill' as const }
    case 'pending':
      return { label: 'Menunggu sinkronisasi', color: 'text-muted-foreground', icon: Clock, weight: 'fill' as const }
    case 'syncing':
      return { label: 'Sedang sinkronisasi...', color: 'text-primary', icon: ArrowsClockwise, weight: 'bold' as const }
    case 'failed':
      return { label: 'Gagal sinkron', color: 'text-destructive', icon: CloudSlash, weight: 'fill' as const }
  }
}

export function TransactionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const router = useRouter()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { currentShift } = useShiftStore()

  const transaction = useLiveQuery(() => db.transactions.get(id), [id])

  const outlet = useLiveQuery(async () => {
    if (!transaction) return null
    return db.outlets.get(transaction.outletId) ?? null
  }, [transaction])

  const tenantConfig = useLiveQuery(() => db.tenantConfig.toCollection().first(), [])

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

  // Can cancel if: completed, belongs to active shift or created today
  const canCancel =
    transaction.status === 'completed' &&
    ((currentShift && transaction.shiftId === currentShift.id) ||
      new Date(transaction.createdAt).toDateString() === new Date().toDateString())

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

  const orderDetail: OrderDetail = {
    id: transaction.id,
    order_number: transaction.orderNumber,
    customer_name: transaction.customerName ?? '',
    status: 'done',
    total_amount: transaction.totalAmount,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
    status_logs: [],
    transaction: {
      id: transaction.id,
      order_number: transaction.orderNumber,
      items: transaction.items.map((item) => ({
        id: item.id,
        service_name: item.serviceName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.pricePerUnit,
        subtotal: item.subtotal,
      })),
      subtotal: transaction.subtotal,
      discount: transaction.discountAmount,
      tax: transaction.taxAmount,
      total_amount: transaction.totalAmount,
      payment_method: payment?.methodName ?? '',
    },
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

      {/* Receipt content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-md mx-auto bg-card border rounded-[var(--radius)] overflow-hidden">
          {/* Outlet header */}
          <div className="text-center py-4 px-4 border-b border-dashed border-border">
            <h2 className="font-bold text-base">{tenantConfig?.tenantName ?? 'LaundryPOS'}</h2>
            {outlet && <p className="text-xs text-muted-foreground mt-0.5">{outlet.name}</p>}
            {(tenantConfig?.address || outlet?.address) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {outlet?.address || tenantConfig?.address}
              </p>
            )}
            {(tenantConfig?.phone || outlet?.phone) && (
              <p className="text-xs text-muted-foreground">
                {outlet?.phone || tenantConfig?.phone}
              </p>
            )}
          </div>

          {/* Order info */}
          <div className="px-4 py-3 border-b border-dashed border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No. Order</span>
              <span className="font-mono font-semibold text-foreground">
                #{transaction.orderNumber}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Tanggal</span>
              <span>
                {formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}
              </span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Pelanggan</span>
                <span className="text-foreground">{transaction.customerName}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon size={12} weight={status.weight} />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Items list */}
          <div className="px-4 py-3 border-b border-dashed border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Item</p>
            <div className="space-y-2">
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

          {/* Price breakdown */}
          <div className="px-4 py-3 border-b border-dashed border-border space-y-1.5">
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

          {/* Payment info */}
          {payment && (
            <div className="px-4 py-3 border-b border-dashed border-border space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
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
            <div className="px-4 py-3 border-b border-dashed border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Catatan</p>
              <p className="text-sm">{transaction.notes}</p>
            </div>
          )}

          {/* Sync status */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <SyncIcon
                size={16}
                weight={sync.weight}
                className={cn(sync.color, transaction.syncStatus === 'syncing' && 'animate-spin')}
              />
              <span className={cn('text-xs font-medium', sync.color)}>{sync.label}</span>
            </div>
            {transaction.syncedAt && (
              <p className="text-center text-xs text-muted-foreground mt-1">
                Disinkronkan: {formatDate(transaction.syncedAt)} {formatTime(transaction.syncedAt)}
              </p>
            )}
            {transaction.syncStatus === 'failed' && transaction.syncRetryCount > 0 && (
              <p className="text-center text-xs text-destructive mt-1">
                Percobaan ulang: {transaction.syncRetryCount}x
              </p>
            )}
          </div>
        </div>

        {/* Receipt actions */}
        <div className="max-w-md mx-auto mt-4">
          <ReceiptActions order={orderDetail} />
        </div>

        {/* Cancel button */}
        {canCancel && (
          <div className="max-w-md mx-auto mt-4">
            <Button
              variant="outline"
              className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              onClick={() => setShowCancelConfirm(true)}
            >
              <Prohibit size={18} weight="fill" />
              Batalkan Transaksi
            </Button>
          </div>
        )}

        {/* Cancelled watermark indicator */}
        {transaction.status === 'cancelled' && (
          <div className="max-w-md mx-auto mt-4 bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] p-3 text-center">
            <p className="text-destructive font-bold text-sm">TRANSAKSI DIBATALKAN</p>
            <p className="text-xs text-muted-foreground mt-1">
              Transaksi ini telah dibatalkan dan tidak dihitung dalam laporan.
            </p>
          </div>
        )}
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
    </div>
  )
}
