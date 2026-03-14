import {
  ChartBar,
  ClipboardText,
  ClockCounterClockwise,
  CloudArrowUp,
  CurrencyDollar,
  Funnel,
  Play,
  Plus,
  Receipt,
  Stop,
  Target,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { DashboardSkeleton } from '@/components/shared/skeleton-loaders'
import { SyncStatusIcon } from '@/components/shared/sync-status-icon'
import { CloseShiftDialog } from '@/components/shift/close-shift-dialog'
import { OpenShiftDialog } from '@/components/shift/open-shift-dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import { ROLE_TENANT_OWNER } from '@/lib/constants'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  getDashboardSummary,
  getCashierPerformance,
  getGoals,
  type DashboardSummary,
  type CashierPerformanceItem,
  type DashboardGoal,
} from '@/services/dashboard-api'
import { useAuthStore } from '@/stores/auth-store'
import { useShiftStore } from '@/stores/shift-store'
import { useSyncStore } from '@/stores/sync-store'

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
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center',
            style.bg,
          )}
        >
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

function useShiftDuration(openedAt: string | undefined) {
  const [duration, setDuration] = useState('')

  useEffect(() => {
    if (!openedAt) {
      setDuration('')
      return
    }

    function computeDuration() {
      const start = new Date(openedAt!).getTime()
      if (Number.isNaN(start)) {
        setDuration('-')
        return
      }
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
              <Play size={16} weight="fill" className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">Shift Aktif</p>
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
            <Stop size={14} weight="fill" className="mr-1" />
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
            <WarningCircle size={16} weight="fill" className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warning">Tidak Ada Shift Aktif</p>
            <p className="text-xs text-warning/80">Buka shift untuk mulai transaksi</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-warning/30 text-warning hover:bg-warning/10"
          onClick={onOpenShift}
        >
          <Play size={14} weight="fill" className="mr-1" />
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

  const isOwner = user?.role === ROLE_TENANT_OWNER

  const currentShift = useShiftStore((s) => s.currentShift)

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

  const shiftTransactions = useLiveQuery(async () => {
    if (!user || !currentShift) return []
    return db.transactions
      .where('createdAt')
      .above('')
      .filter((t) => t.tenantId === user.tenantId && t.shiftId === currentShift.id && t.status === 'completed')
      .toArray()
  }, [user, currentShift])

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

  if (todayTransactions === undefined || recentTransactions === undefined || shiftTransactions === undefined) {
    return <DashboardSkeleton />
  }

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
  const todayCount = todayTransactions.length
  const avgTransaction = todayCount > 0 ? todayRevenue / todayCount : 0
  const shiftRevenue = shiftTransactions.reduce((sum, t) => sum + t.totalAmount, 0)
  const shiftCount = shiftTransactions.length

  if (!isOwner) {
    // Cashier dashboard
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {user?.name}</p>
        </div>

        {/* Shift status */}
        <div className="px-4 mb-3">
          <ShiftStatusCard
            onOpenShift={() => setOpenShiftDialog(true)}
            onCloseShift={() => setCloseShiftDialog(true)}
          />
        </div>

        {/* Shift totals */}
        {currentShift && (
          <div className="px-4 mb-3">
            <div className="bg-card border rounded-[var(--radius)] p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Shift Saat Ini</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{shiftCount}</p>
                  <p className="text-xs text-muted-foreground">Transaksi</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-success">{formatCurrency(shiftRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatCurrency((currentShift.opening_cash ?? 0) + shiftRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Kas Saat Ini</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's stats */}
        <div className="px-4 grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Receipt size={22} weight="fill" />}
            label="Transaksi Hari Ini"
            value={todayCount.toString()}
            variant="info"
          />
          <SummaryCard
            icon={<CurrencyDollar size={22} weight="fill" />}
            label="Revenue Hari Ini"
            value={formatCurrency(todayRevenue)}
            variant="success"
          />
          <SummaryCard
            icon={<CloudArrowUp size={22} weight="fill" />}
            label="Pending Sync"
            value={pendingCount.toString()}
            subValue={pendingCount === 0 ? 'Semua tersinkron' : 'menunggu'}
            variant="warning"
          />
          <SummaryCard
            icon={<TrendUp size={22} weight="fill" />}
            label="Rata-rata"
            value={formatCurrency(avgTransaction)}
            subValue="per transaksi"
            variant="primary"
          />
        </div>

        {/* Quick actions */}
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Aksi Cepat</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => router.navigate({ to: '/' })}
            >
              <Plus size={20} weight="bold" />
              <span className="text-xs">Buat Transaksi</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => router.navigate({ to: '/orders' })}
            >
              <ClipboardText size={20} weight="fill" />
              <span className="text-xs">Lihat Pesanan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => router.navigate({ to: '/transactions' })}
            >
              <ClockCounterClockwise size={20} weight="fill" />
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
            <EmptyState
              icon={<Receipt size={32} weight="fill" />}
              title="Belum Ada Transaksi"
              description="Transaksi hari ini akan muncul di sini."
            />
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
                      <SyncStatusIcon status={tx.syncStatus} />
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
                      <p className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</p>
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

  // Owner dashboard — uses API data
  return (
    <OwnerDashboard
      user={user}
      openShiftDialog={openShiftDialog}
      closeShiftDialog={closeShiftDialog}
      setOpenShiftDialog={setOpenShiftDialog}
      setCloseShiftDialog={setCloseShiftDialog}
    />
  )
}

function OwnerDashboard({
  user,
  openShiftDialog,
  closeShiftDialog,
  setOpenShiftDialog,
  setCloseShiftDialog,
}: {
  user: ReturnType<typeof useAuthStore.getState>['user']
  openShiftDialog: boolean
  closeShiftDialog: boolean
  setOpenShiftDialog: (v: boolean) => void
  setCloseShiftDialog: (v: boolean) => void
}) {
  const router = useRouter()
  const pendingCount = useSyncStore((s) => s.pendingCount)

  const outlets = useLiveQuery(() => db.outlets.toArray()) ?? []
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [cashiers, setCashiers] = useState<CashierPerformanceItem[]>([])
  const [goals, setGoals] = useState<DashboardGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const outletParam = selectedOutletId || undefined
      const [summaryRes, cashierRes, goalsRes] = await Promise.all([
        getDashboardSummary(outletParam),
        getCashierPerformance(30, outletParam),
        getGoals(),
      ])
      setSummary(summaryRes.data)
      setCashiers(cashierRes.data ?? [])
      setGoals(goalsRes.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedOutletId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <DashboardSkeleton />
  if (error) return <InlineError message="Gagal memuat dashboard" onRetry={fetchData} />

  const growthSign = (summary?.revenue_growth_pct ?? 0) >= 0 ? '+' : ''

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Selamat datang, {user?.name}</p>
          </div>
          {outlets.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Funnel size={16} weight="fill" className="text-muted-foreground" />
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="text-sm bg-background border border-input rounded-[var(--radius)] px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Semua Outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Shift status */}
      <div className="px-4 mb-3">
        <ShiftStatusCard
          onOpenShift={() => setOpenShiftDialog(true)}
          onCloseShift={() => setCloseShiftDialog(true)}
        />
      </div>

      {/* Summary cards — API sourced */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <SummaryCard
          icon={<CurrencyDollar size={22} weight="fill" />}
          label="Revenue Hari Ini"
          value={formatCurrency(summary?.today_revenue ?? 0)}
          variant="success"
        />
        <SummaryCard
          icon={<Receipt size={22} weight="fill" />}
          label="Transaksi Hari Ini"
          value={String(summary?.today_transactions ?? 0)}
          variant="info"
        />
        <SummaryCard
          icon={<TrendUp size={22} weight="fill" />}
          label="Revenue Bulan Ini"
          value={formatCurrency(summary?.month_revenue ?? 0)}
          subValue={`${growthSign}${(summary?.revenue_growth_pct ?? 0).toFixed(1)}% dari bulan lalu`}
          variant="primary"
        />
        <SummaryCard
          icon={<ChartBar size={22} weight="fill" />}
          label="Profit Bulan Ini"
          value={formatCurrency(summary?.month_profit ?? 0)}
          subValue={`Margin ${(summary?.margin_percent ?? 0).toFixed(1)}%`}
          variant={(summary?.month_profit ?? 0) >= 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Cashier performance */}
      {cashiers.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
            Performa Kasir (30 hari)
          </h2>
          <div className="bg-card border rounded-[var(--radius)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Kasir</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Tx</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c) => (
                  <tr key={c.user_id} className="border-b last:border-b-0">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-right text-muted-foreground">{c.tx_count}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
            <Target size={14} weight="fill" className="inline mr-1" />
            Target
          </h2>
          <div className="space-y-2">
            {goals.map((g) => {
              const pct = g.target_value > 0 ? Math.min((g.current_value / g.target_value) * 100, 100) : 0
              const label =
                g.goal_type === 'daily_revenue'
                  ? 'Revenue Harian'
                  : g.goal_type === 'monthly_revenue'
                    ? 'Revenue Bulanan'
                    : 'Transaksi Harian'
              return (
                <div key={g.id} className="bg-card border rounded-[var(--radius)] p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {g.goal_type.includes('revenue')
                        ? `${formatCurrency(g.current_value)} / ${formatCurrency(g.target_value)}`
                        : `${g.current_value} / ${g.target_value}`}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-primary' : 'bg-amber-500',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Aksi Cepat</h2>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/manage/analytics' as any })}
          >
            <ChartBar size={20} weight="fill" />
            <span className="text-xs">Analitik</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/manage/finance' as any })}
          >
            <CurrencyDollar size={20} weight="fill" />
            <span className="text-xs">Keuangan</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex-col gap-1.5"
            onClick={() => router.navigate({ to: '/transactions' })}
          >
            <ClockCounterClockwise size={20} weight="fill" />
            <span className="text-xs">Riwayat</span>
          </Button>
        </div>
      </div>

      {/* Sync status */}
      {pendingCount > 0 && (
        <div className="px-4 mt-3">
          <div className="bg-warning/10 border border-warning/20 rounded-[var(--radius)] p-3 flex items-center gap-2">
            <CloudArrowUp size={18} weight="fill" className="text-warning" />
            <span className="text-sm text-warning font-medium">
              {pendingCount} transaksi menunggu sinkronisasi
            </span>
          </div>
        </div>
      )}

      <div className="pb-6" />

      <OpenShiftDialog open={openShiftDialog} onOpenChange={setOpenShiftDialog} />
      <CloseShiftDialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog} />
    </div>
  )
}
