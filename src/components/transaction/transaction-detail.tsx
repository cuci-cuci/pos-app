import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { SyncStatus } from '@/db/schema'

interface TransactionDetailProps {
  transactionId: string
}

const syncBadgeVariant: Record<SyncStatus, 'success' | 'default' | 'destructive' | 'secondary'> = {
  synced: 'success',
  syncing: 'default',
  pending: 'secondary',
  failed: 'destructive',
}

const syncLabel: Record<SyncStatus, string> = {
  synced: 'Tersinkron',
  syncing: 'Mengirim...',
  pending: 'Menunggu',
  failed: 'Gagal',
}

export function TransactionDetail({ transactionId }: TransactionDetailProps) {
  const transaction = useLiveQuery(
    () => db.transactions.get(transactionId),
    [transactionId]
  )

  if (transaction === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (transaction === null) {
    return (
      <div className="p-4 text-center text-[var(--muted-foreground)]">
        Transaksi tidak ditemukan
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{transaction.orderNumber}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {formatDate(transaction.createdAt)} &middot; {formatTime(transaction.createdAt)}
          </p>
        </div>
        <Badge variant={syncBadgeVariant[transaction.syncStatus]}>
          {syncLabel[transaction.syncStatus]}
        </Badge>
      </div>

      {transaction.customerName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{transaction.customerName}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transaction.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="font-medium">{item.serviceName}</span>
                <span className="text-[var(--muted-foreground)] ml-2">
                  {item.quantity} {item.unit} x {formatCurrency(item.pricePerUnit)}
                </span>
              </div>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>

          {transaction.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Diskon ({transaction.discountPercent}%)
              </span>
              <span className="text-[var(--destructive)]">
                -{formatCurrency(transaction.discountAmount)}
              </span>
            </div>
          )}

          {transaction.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Pajak ({transaction.taxRate}%)
              </span>
              <span>{formatCurrency(transaction.taxAmount)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(transaction.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transaction.payments.map((payment) => (
            <div key={payment.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{payment.methodName}</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              {payment.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Tunai diterima</span>
                    <span>{formatCurrency(payment.cashTendered)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Kembalian</span>
                    <span>{formatCurrency(payment.changeAmount ?? 0)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Info Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-[var(--muted-foreground)]">
          <div className="flex justify-between">
            <span>Config Version</span>
            <span>v{transaction.configVersion}</span>
          </div>
          <div className="flex justify-between">
            <span>Dibuat</span>
            <span>{formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}</span>
          </div>
          {transaction.syncedAt && (
            <div className="flex justify-between">
              <span>Disinkronkan</span>
              <span>{formatDate(transaction.syncedAt)} {formatTime(transaction.syncedAt)}</span>
            </div>
          )}
          {transaction.notes && (
            <div className="mt-2">
              <span className="font-medium">Catatan: </span>
              <span>{transaction.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
