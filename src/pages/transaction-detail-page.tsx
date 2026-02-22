import { useParams, useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Receipt,
  CloudCheck,
  CloudOff,
} from 'lucide-react'
import type { SyncStatus, TransactionStatus } from '@/db/schema'

function statusLabel(status: TransactionStatus) {
  switch (status) {
    case 'completed':
      return { label: 'Selesai', variant: 'success' as const, icon: CheckCircle }
    case 'cancelled':
      return { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle }
    case 'refunded':
      return { label: 'Refund', variant: 'secondary' as const, icon: RefreshCw }
  }
}

function syncStatusInfo(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return { label: 'Tersinkron', color: 'text-success', icon: CloudCheck }
    case 'pending':
      return { label: 'Menunggu sinkronisasi', color: 'text-muted-foreground', icon: Clock }
    case 'syncing':
      return { label: 'Sedang sinkronisasi...', color: 'text-primary', icon: RefreshCw }
    case 'failed':
      return { label: 'Gagal sinkron', color: 'text-destructive', icon: CloudOff }
  }
}

export function TransactionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const router = useRouter()

  const transaction = useLiveQuery(() => db.transactions.get(id), [id])

  const outlet = useLiveQuery(async () => {
    if (!transaction) return null
    return db.outlets.get(transaction.outletId) ?? null
  }, [transaction])

  const tenantConfig = useLiveQuery(
    () => db.tenantConfig.toCollection().first(),
    []
  )

  if (transaction === undefined) {
    return <LoadingSpinner />
  }

  if (!transaction) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/transactions' })}
        >
          <ArrowLeft size={20} />
        </Button>
        <EmptyState
          icon={<Receipt size={48} />}
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/transactions' })}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">Detail Transaksi</h1>
      </div>

      {/* Receipt content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-md mx-auto bg-card border rounded-[var(--radius)] overflow-hidden">
          {/* Outlet header */}
          <div className="text-center py-4 px-4 border-b border-dashed border-border">
            <h2 className="font-bold text-base">
              {tenantConfig?.tenantName ?? 'LaundryPOS'}
            </h2>
            {outlet && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {outlet.name}
              </p>
            )}
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
              <span>{formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}</span>
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
                <StatusIcon size={12} />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Items list */}
          <div className="px-4 py-3 border-b border-dashed border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Item
            </p>
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.serviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} x {formatCurrency(item.pricePerUnit)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
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
                <span className="text-success">
                  -{formatCurrency(transaction.discountAmount)}
                </span>
              </div>
            )}
            {transaction.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Pajak ({transaction.taxRate}%)
                </span>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Catatan
              </p>
              <p className="text-sm">{transaction.notes}</p>
            </div>
          )}

          {/* Sync status */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <SyncIcon
                size={16}
                className={cn(
                  sync.color,
                  transaction.syncStatus === 'syncing' && 'animate-spin'
                )}
               
              />
              <span className={cn('text-xs font-medium', sync.color)}>
                {sync.label}
              </span>
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
      </div>
    </div>
  )
}
