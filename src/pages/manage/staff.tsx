import {
  ArrowLeft,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { staffApi, type StaffSummary } from '@/services/staff-api'

export function ManageStaffPage() {
  const router = useRouter()
  const [summaries, setSummaries] = useState<StaffSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [days, setDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await staffApi.getSummaries(days)
      setSummaries(res.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const periods: { value: number; label: string }[] = [
    { value: 7, label: '7 Hari' },
    { value: 30, label: '30 Hari' },
    { value: 90, label: '90 Hari' },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Performa Staf</h1>
          <p className="text-sm text-muted-foreground">Monitoring kasir & aktivitas</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="px-4 pb-3 flex gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={days === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat data staf" onRetry={fetchData} />
        ) : summaries.length === 0 ? (
          <EmptyState
            icon={<UserCircle size={32} />}
            title="Belum ada data staf"
            description="Data performa kasir akan muncul setelah ada transaksi"
          />
        ) : (
          <div className="space-y-3">
            {summaries.map((s) => {
              const hasIssues = s.cancel_count > 0 || s.refund_count > 0
              return (
                <div key={s.user_id} className="bg-card border rounded-[var(--radius)] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle size={24} weight="fill" className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.tx_count} transaksi · {formatCurrency(s.revenue)}
                      </p>
                    </div>
                    {hasIssues && (
                      <WarningCircle size={18} weight="fill" className="text-warning" />
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-muted/50 rounded-[var(--radius)]">
                      <p className="text-lg font-bold">{s.tx_count}</p>
                      <p className="text-[10px] text-muted-foreground">Transaksi</p>
                    </div>
                    <div className="text-center p-2 bg-success/10 rounded-[var(--radius)]">
                      <p className="text-lg font-bold text-success">
                        {s.tx_count > 0
                          ? formatCurrency(Math.round(s.revenue / s.tx_count))
                          : '-'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Rata-rata</p>
                    </div>
                    <div
                      className={cn(
                        'text-center p-2 rounded-[var(--radius)]',
                        s.cancel_count > 0 ? 'bg-destructive/10' : 'bg-muted/50',
                      )}
                    >
                      <p
                        className={cn(
                          'text-lg font-bold',
                          s.cancel_count > 0 && 'text-destructive',
                        )}
                      >
                        {s.cancel_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Batal</p>
                    </div>
                    <div
                      className={cn(
                        'text-center p-2 rounded-[var(--radius)]',
                        s.refund_count > 0 ? 'bg-warning/10' : 'bg-muted/50',
                      )}
                    >
                      <p
                        className={cn(
                          'text-lg font-bold',
                          s.refund_count > 0 && 'text-warning',
                        )}
                      >
                        {s.refund_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Refund</p>
                    </div>
                  </div>

                  {/* Cancel/refund amounts */}
                  {hasIssues && (
                    <div className="mt-2 pt-2 border-t flex gap-4 text-xs text-muted-foreground">
                      {s.cancel_count > 0 && (
                        <span>
                          Batal: <span className="text-destructive font-medium">{formatCurrency(s.cancel_amount)}</span>
                        </span>
                      )}
                      {s.refund_count > 0 && (
                        <span>
                          Refund: <span className="text-warning font-medium">{formatCurrency(s.refund_amount)}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
