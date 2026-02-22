import { useState, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import {
  MagnifyingGlass,
  Receipt,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Warning,
  Clock,
} from '@phosphor-icons/react'
import type { SyncStatus, TransactionStatus } from '@/db/schema'

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
          <CheckCircle size={12} weight="bold" />
          Selesai
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={12} weight="bold" />
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

function getSyncIcon(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return <CheckCircle size={14} className="text-[var(--success)]" weight="fill" />
    case 'pending':
      return <Clock size={14} className="text-[var(--muted-foreground)]" weight="fill" />
    case 'syncing':
      return <ArrowsClockwise size={14} className="text-[var(--primary)] animate-spin" />
    case 'failed':
      return <Warning size={14} className="text-[var(--destructive)]" weight="fill" />
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
      return await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'failed'])
        .reverse()
        .sortBy('createdAt')
    }

    // Get all transactions for this tenant, sorted by createdAt descending
    const all = await db.transactions
      .where('createdAt')
      .above('')
      .filter((t) => t.tenantId === user.tenantId)
      .reverse()
      .sortBy('createdAt')

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
      (t) =>
        t.orderNumber.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q)
    )
  }, [transactions, search])

  const handleSelect = (id: string) => {
    void router.navigate({ to: '/transactions/$id', params: { id } })
  }

  if (transactions === undefined) {
    return <LoadingSpinner />
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
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            )}
          >
            {tab.label}
            {tab.id === 'failed' && failedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[var(--destructive)] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {failedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <Input
            placeholder="Cari no. order atau nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
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
                className="w-full text-left bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] p-3 active:bg-[var(--muted)] transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        #{tx.orderNumber}
                      </span>
                      {getSyncIcon(tx.syncStatus)}
                    </div>
                    {tx.customerName && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                        {tx.customerName}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(tx.totalAmount)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {getStatusBadge(tx.status)}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {tx.items.length} item
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
