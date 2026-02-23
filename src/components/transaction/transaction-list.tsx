import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Receipt } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { startOfDay } from 'date-fns'
import type { Transaction, SyncStatus } from '@/db/schema'

interface TransactionListProps {
  filter: 'today' | 'pending' | 'all'
  onSelect: (id: string) => void
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

export function TransactionList({ filter, onSelect }: TransactionListProps) {
  const tenantId = useAuthStore((s) => s.user?.tenantId)

  const transactions = useLiveQuery(
    () => {
      if (!tenantId) return [] as Transaction[]

      if (filter === 'pending') {
        return db.transactions
          .where('[tenantId+syncStatus]')
          .anyOf(
            [tenantId, 'pending'],
            [tenantId, 'failed']
          )
          .reverse()
          .toArray()
      }

      return db.transactions
        .where('[tenantId+status]')
        .equals([tenantId, 'completed'])
        .reverse()
        .toArray()
        .then((txs: Transaction[]) => {
          if (filter === 'today') {
            const todayStart = startOfDay(new Date()).toISOString()
            return txs.filter((tx: Transaction) => tx.createdAt >= todayStart)
          }
          return txs
        })
    },
    [tenantId, filter]
  )

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={48} weight="fill" />}
        title="Belum ada transaksi"
        description={
          filter === 'pending'
            ? 'Semua transaksi sudah tersinkronisasi'
            : 'Transaksi akan muncul di sini setelah pembayaran'
        }
      />
    )
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx: Transaction) => (
        <button
          type="button"
          key={tx.id}
          onClick={() => onSelect(tx.id)}
          className={cn(
            'w-full flex items-center justify-between p-4 text-left',
            'hover:bg-accent active:bg-accent transition-colors',
            'min-h-[64px]'
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{tx.orderNumber}</p>
            <p className="text-xs text-muted-foreground truncate">
              {tx.customerName ?? 'Tanpa pelanggan'} &middot;{' '}
              {formatDate(tx.createdAt)} {formatTime(tx.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-3">
            <span className="text-sm font-bold">{formatCurrency(tx.totalAmount)}</span>
            <Badge variant={syncBadgeVariant[tx.syncStatus]}>
              {syncLabel[tx.syncStatus]}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  )
}
