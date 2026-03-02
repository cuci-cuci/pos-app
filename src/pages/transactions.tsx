import {
  ArrowsClockwise,
  CheckCircle,
  DownloadSimple,
  MagnifyingGlass,
  Receipt,
  XCircle,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { TransactionListSkeleton } from '@/components/shared/skeleton-loaders'
import { SyncStatusIcon } from '@/components/shared/sync-status-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import type { TransactionStatus } from '@/db/schema'
import { exportCSV } from '@/lib/export'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'

type FilterTab = 'today' | 'all' | 'failed'

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'all', label: 'Semua' },
  { id: 'failed', label: 'Gagal Sinkron' },
]

function getStatusBadge(status: TransactionStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle size={12} weight="fill" />
          Selesai
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={12} weight="fill" />
          Batal
        </Badge>
      )
    case 'refunded':
      return (
        <Badge variant="secondary" className="gap-1">
          <ArrowsClockwise size={12} weight="bold" />
          Refund
        </Badge>
      )
  }
}

export function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('today')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const failedCount = useSyncStore((s) => s.failedCount)

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  const transactions = useLiveQuery(async () => {
    if (!user) return []

    if (activeTab === 'failed') {
      const results = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'failed'])
        .toArray()
      return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    // Get all transactions for this tenant, sorted by createdAt descending
    const all = await db.transactions
      .where('tenantId')
      .equals(user.tenantId)
      .toArray()
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (activeTab === 'today') {
      return all.filter((t) => t.createdAt >= todayStart)
    }

    return all
  }, [user, activeTab, todayStart])

  const filtered = useMemo(() => {
    if (!transactions) return []
    if (!search.trim()) return transactions

    const q = search.toLowerCase()
    return transactions.filter(
      (t) => t.orderNumber.toLowerCase().includes(q) || t.customerName?.toLowerCase().includes(q),
    )
  }, [transactions, search])

  const handleSelect = (id: string) => {
    void router.navigate({ to: '/transactions/$id', params: { id } })
  }

  const handleExport = () => {
    if (filtered.length === 0) return
    const rows = filtered.map((t) => ({
      orderNumber: t.orderNumber,
      customerName: t.customerName ?? '-',
      status: t.status,
      totalAmount: t.totalAmount,
      itemCount: t.items.length,
      createdAt: t.createdAt,
    }))
    exportCSV(
      rows,
      [
        { key: 'orderNumber', label: 'No. Order' },
        { key: 'customerName', label: 'Pelanggan' },
        { key: 'status', label: 'Status' },
        { key: 'totalAmount', label: 'Total' },
        { key: 'itemCount', label: 'Jumlah Item' },
        { key: 'createdAt', label: 'Waktu' },
      ],
      `transaksi-${new Date().toISOString().slice(0, 10)}`,
    )
  }

  if (transactions === undefined) {
    return <TransactionListSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium rounded-[var(--radius)] transition-colors relative',
              'min-h-[44px] touch-manipulation',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {tab.label}
            {tab.id === 'failed' && failedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {failedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Export */}
      <div className="px-4 pb-2 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari no. order atau nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {filtered.length > 0 && (
          <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV">
            <DownloadSimple size={18} weight="bold" />
          </Button>
        )}
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} weight="fill" />}
            title="Tidak ada transaksi"
            description={
              search
                ? 'Tidak ditemukan transaksi yang cocok dengan pencarian.'
                : activeTab === 'failed'
                  ? 'Tidak ada transaksi yang gagal sinkron.'
                  : 'Belum ada transaksi.'
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((tx) => (
              <button
                type="button"
                key={tx.id}
                onClick={() => handleSelect(tx.id)}
                className="w-full text-left bg-card rounded-[var(--radius)] border p-3 active:bg-muted transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        #{tx.orderNumber}
                      </span>
                      <SyncStatusIcon status={tx.syncStatus} />
                    </div>
                    {tx.customerName && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {tx.customerName}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        tx.status === 'cancelled' && 'line-through text-muted-foreground',
                      )}
                    >
                      {formatCurrency(tx.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {getStatusBadge(tx.status)}
                  <span className="text-xs text-muted-foreground">{tx.items.length} item</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
