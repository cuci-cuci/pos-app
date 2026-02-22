import { useState, useMemo, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { useShiftStore } from '@/stores/shift-store'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { OpenShiftDialog } from '@/components/shift/open-shift-dialog'
import { CloseShiftDialog } from '@/components/shift/close-shift-dialog'
import {
  DollarSign,
  Receipt,
  CloudUpload,
  TrendingUp,
  Plus,
  History,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Square,
  ClipboardList,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { SyncStatus } from '@/db/schema'

type CardVariant = 'primary' | 'success' | 'warning' | 'info'

const variantStyles: Record<CardVariant, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/15', text: 'text-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning' },
  info: { bg: 'bg-info/15', text: 'text-info' },
}

interface SummaryCardProps {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
  variant?: CardVariant
}

function SummaryCard({ icon, label, value, subValue, variant = 'primary' }: SummaryCardProps) {
  const style = variantStyles[variant]
  return (
    <div className="bg-card border rounded-[var(--radius)] p-4">
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center', style.bg)}>
          <span className={style.text}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-lg font-bold mt-0.5 truncate">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

function getSyncIcon(syncStatus: SyncStatus) {
  switch (syncStatus) {
    case 'synced':
      return <CheckCircle size={14} className="text-success" />
    case 'pending':
      return <Clock size={14} className="text-muted-foreground" />
    case 'failed':
      return <AlertTriangle size={14} className="text-destructive" />
    default:
      return <RefreshCw size={14} className="text-primary animate-spin" />
  }
}

function useShiftDuration(openedAt: string | undefined) {
  const [duration, setDuration] = useState('')

  useEffect(() => {
    if (!openedAt) {
      setDuration('')
      return
    }

    function computeDuration() {
      const start = new Date(openedAt!).getTime()
      if (isNaN(start)) { setDuration('-'); return }
      const now = Date.now()
      const diffMs = now - start
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      if (hours > 0) {
        setDuration(`${hours}j ${minutes}m`)
      } else {
        setDuration(`${minutes}m`)
      }
    }

    computeDuration()
    const interval = setInterval(computeDuration, 60_000)
    return () => clearInterval(interval)
  }, [openedAt])

  return duration
}

interface ShiftStatusCardProps {
  onOpenShift: () => void
  onCloseShift: () => void
}

function ShiftStatusCard({ onOpenShift, onCloseShift }: ShiftStatusCardProps) {
  const currentShift = useShiftStore((s) => s.currentShift)
  const duration = useShiftDuration(currentShift?.opened_at)

  if (currentShift) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-[var(--radius)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
              <Play size={16} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">
                Shift Aktif
              </p>
              <p className="text-xs text-success/80">
                Kas awal: {formatCurrency(currentShift.opening_cash)}
                {duration && <> &middot; {duration}</>}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-success/30 text-success hover:bg-success/10"
            onClick={onCloseShift}
          >
            <Square size={14} className="mr-1" />
            Tutup Shift
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-[var(--radius)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-warning/15 flex items-center justify-center">
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warning">
              Tidak Ada Shift Aktif
            </p>
            <p className="text-xs text-warning/80">
              Buka shift untuk mulai transaksi
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-warning/30 text-warning hover:bg-warning/10"
          onClick={onOpenShift}
        >
          <Play size={14} className="mr-1" />
          Buka Shift
        </Button>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  const [openShiftDialog, setOpenShiftDialog] = useState(false)
  const [closeShiftDialog, setCloseShiftDialog] = useState(false)

  const isOwner = user?.role === 'tenant_owner'

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

  if (todayTransactions === undefined || recentTransactions === undefined) {
    return <LoadingSpinner />
  }

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
  const todayCount = todayTransactions.length
  const avgTransaction = todayCount > 0 ? todayRevenue / todayCount : 0

  if (!isOwner) {
    // Cashier dashboard
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang, {user?.name}
          </p>
        </div>

        {/* Shift status */}
        <div className="px-4 mb-3">
          <ShiftStatusCard
            onOpenShift={() => setOpenShiftDialog(true)}
            onCloseShift={() => setCloseShiftDialog(true)}
          />
        </div>

        {/* Today's stats */}
        <div className="px-4 grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Receipt size={22} />}
            label="Transaksi Hari Ini"
            value={todayCount.toString()}
            variant="info"
          />
          <SummaryCard
            icon={<DollarSign size={22} />}
            label="Revenue Hari Ini"
            value={formatCurrency(todayRevenue)}
            variant="success"
          />
          <SummaryCard
            icon={<CloudUpload size={22} />}
            label="Pending Sync"
            value={pendingCount.toString()}
            subValue={pendingCount === 0 ? 'Semua tersinkron' : 'menunggu'}
            variant="warning"
          />
          <SummaryCard
            icon={<TrendingUp size={22} />}
            label="Rata-rata"
            value={formatCurrency(avgTransaction)}
            subValue="per transaksi"
            variant="primary"
          />
        </div>

        {/* Quick actions */}
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
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
              onClick={() => router.navigate({ to: '/orders' })}
            >
              <ClipboardList size={20} />
              <span className="text-xs">Lihat Pesanan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => router.navigate({ to: '/transactions' })}
            >
              <History size={20} />
              <span className="text-xs">Riwayat</span>
            </Button>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="px-4 mt-4 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
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
            <div className="bg-card border rounded-[var(--radius)] p-6 text-center">
              <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <button
                  type="button"
                  key={tx.id}
                  onClick={() =>
                    router.navigate({ to: '/transactions/$id', params: { id: tx.id } })
                  }
                  className="w-full text-left bg-card border rounded-[var(--radius)] p-3 active:bg-muted transition-colors touch-manipulation"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getSyncIcon(tx.syncStatus)}
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">#{tx.orderNumber}</span>
                        {tx.customerName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.customerName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatCurrency(tx.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <OpenShiftDialog open={openShiftDialog} onOpenChange={setOpenShiftDialog} />
        <CloseShiftDialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog} />
      </div>
    )
  }

  // Owner dashboard
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {user?.name}
        </p>
      </div>

      {/* Shift status for owners too */}
      <div className="px-4 mb-3">
        <ShiftStatusCard
          onOpenShift={() => setOpenShiftDialog(true)}
          onCloseShift={() => setCloseShiftDialog(true)}
        />
      </div>

      {/* Summary cards */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<DollarSign size={22} />}
          label="Revenue Hari Ini"
          value={formatCurrency(todayRevenue)}
          variant="success"
        />
        <SummaryCard
          icon={<Receipt size={22} />}
          label="Total Transaksi"
          value={todayCount.toString()}
          subValue="hari ini"
          variant="info"
        />
        <SummaryCard
          icon={<CloudUpload size={22} />}
          label="Pending Sync"
          value={pendingCount.toString()}
          subValue={pendingCount === 0 ? 'Semua tersinkron' : 'menunggu'}
          variant="warning"
        />
        <SummaryCard
          icon={<TrendingUp size={22} />}
          label="Rata-rata Transaksi"
          value={formatCurrency(avgTransaction)}
          subValue="per transaksi"
          variant="primary"
        />
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
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
            <History size={20} />
            <span className="text-xs">Lihat Riwayat</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/settings' })}
          >
            <RefreshCw size={20} />
            <span className="text-xs">Sinkronisasi</span>
          </Button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 mt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
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
          <div className="bg-card border rounded-[var(--radius)] p-6 text-center">
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <button
                type="button"
                key={tx.id}
                onClick={() =>
                  router.navigate({ to: '/transactions/$id', params: { id: tx.id } })
                }
                className="w-full text-left bg-card border rounded-[var(--radius)] p-3 active:bg-muted transition-colors touch-manipulation"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getSyncIcon(tx.syncStatus)}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">#{tx.orderNumber}</span>
                      {tx.customerName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {tx.customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(tx.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <OpenShiftDialog open={openShiftDialog} onOpenChange={setOpenShiftDialog} />
      <CloseShiftDialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog} />
    </div>
  )
}
