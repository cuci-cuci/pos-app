import { useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import {
  CurrencyDollar,
  Receipt,
  CloudArrowUp,
  TrendUp,
  Plus,
  ClockCounterClockwise,
  ArrowsClockwise,
  ShieldCheck,
  CheckCircle,
  Warning,
  Clock,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { SyncStatus } from '@/db/schema'

interface SummaryCardProps {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
  iconBg: string
  iconColor: string
}

function SummaryCard({ icon, label, value, subValue, iconBg, iconColor }: SummaryCardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center',
            iconBg
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">{label}</p>
          <p className="text-lg font-bold mt-0.5 truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getSyncIcon(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return <CheckCircle size={14} className="text-[var(--success)]" weight="fill" />
    case 'pending':
      return <Clock size={14} className="text-[var(--muted-foreground)]" weight="fill" />
    case 'failed':
      return <Warning size={14} className="text-[var(--destructive)]" weight="fill" />
    default:
      return <ArrowsClockwise size={14} className="text-[var(--primary)] animate-spin" />
  }
}

export function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  const isOwner = user?.role === 'owner'

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  const todayTransactions = useLiveQuery(async () => {
    if (!user) return []
    return db.transactions
      .where('createdAt')
      .above(todayStart)
      .filter((t) => t.tenantId === user.tenantId && t.status === 'completed')
      .toArray()
  }, [user, todayStart])

  const recentTransactions = useLiveQuery(async () => {
    if (!user) return []
    const all = await db.transactions
      .where('createdAt')
      .above('')
      .filter((t) => t.tenantId === user.tenantId)
      .reverse()
      .sortBy('createdAt')
    return all.slice(0, 5)
  }, [user])

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <EmptyState
          icon={<ShieldCheck size={48} />}
          title="Akses Terbatas"
          description="Dashboard hanya tersedia untuk pemilik (owner)."
        />
      </div>
    )
  }

  if (todayTransactions === undefined || recentTransactions === undefined) {
    return <LoadingSpinner />
  }

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
  const todayCount = todayTransactions.length
  const avgTransaction = todayCount > 0 ? todayRevenue / todayCount : 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Selamat datang, {user?.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<CurrencyDollar size={22} weight="bold" />}
          label="Revenue Hari Ini"
          value={formatCurrency(todayRevenue)}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          icon={<Receipt size={22} weight="bold" />}
          label="Total Transaksi"
          value={todayCount.toString()}
          subValue="hari ini"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <SummaryCard
          icon={<CloudArrowUp size={22} weight="bold" />}
          label="Pending Sync"
          value={pendingCount.toString()}
          subValue={pendingCount === 0 ? 'Semua tersinkron' : 'menunggu'}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          icon={<TrendUp size={22} weight="bold" />}
          label="Rata-rata Transaksi"
          value={formatCurrency(avgTransaction)}
          subValue="per transaksi"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase mb-2">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/' })}
          >
            <Plus size={20} />
            <span className="text-xs">Buat Transaksi</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/transactions' })}
          >
            <ClockCounterClockwise size={20} />
            <span className="text-xs">Lihat Riwayat</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/settings' })}
          >
            <ArrowsClockwise size={20} />
            <span className="text-xs">Sinkronisasi</span>
          </Button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase">
            Transaksi Terbaru
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => router.navigate({ to: '/transactions' })}
          >
            Lihat Semua
          </Button>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() =>
                  router.navigate({ to: '/transactions/$id', params: { id: tx.id } })
                }
                className="w-full text-left bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-3 active:bg-[var(--muted)] transition-colors touch-manipulation"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getSyncIcon(tx.syncStatus)}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">#{tx.orderNumber}</span>
                      {tx.customerName && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {tx.customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(tx.totalAmount)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
