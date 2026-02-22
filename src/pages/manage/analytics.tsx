import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  CurrencyDollar,
  Receipt,
  TrendUp,
  ChartBar,
  Storefront,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ownerApi } from '@/services/owner-api'
import type { ReactNode } from 'react'

interface SummaryData {
  total_revenue: number
  total_transactions: number
  avg_transaction: number
  growth_pct: number
}

interface OutletAnalytics {
  outlet_id: string
  outlet_name: string
  revenue: number
  transactions: number
}

type Period = '7d' | '30d' | '90d'

function SummaryCard({
  icon,
  label,
  value,
  subValue,
  iconBg,
  iconColor,
}: {
  icon: ReactNode
  label: string
  value: string
  subValue?: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center',
            iconBg,
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">
            {label}
          </p>
          <p className="text-lg font-bold mt-0.5 truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ManageAnalyticsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('30d')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [outlets, setOutlets] = useState<OutletAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const [summaryRes, outletsRes] = await Promise.all([
        ownerApi.analyticsSummary({ period }),
        ownerApi.analyticsOutlets({ period }),
      ])
      setSummary(summaryRes.data ?? null)
      setOutlets(outletsRes.data ?? [])
    } catch {
      alert('Gagal memuat data analitik')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const periods: { value: Period; label: string }[] = [
    { value: '7d', label: '7 Hari' },
    { value: '30d', label: '30 Hari' },
    { value: '90d', label: '90 Hari' },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/manage' })}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Analitik</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Laporan dan statistik
          </p>
        </div>
      </div>

      <div className="px-4 pb-3 flex gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <LoadingSpinner />
        ) : !summary ? (
          <EmptyState
            icon={<ChartBar size={48} />}
            title="Data Tidak Tersedia"
            description="Belum ada data analitik untuk periode ini."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <SummaryCard
                icon={<CurrencyDollar size={22} weight="bold" />}
                label="Total Revenue"
                value={formatCurrency(summary.total_revenue)}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <SummaryCard
                icon={<Receipt size={22} weight="bold" />}
                label="Total Transaksi"
                value={String(summary.total_transactions)}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <SummaryCard
                icon={<TrendUp size={22} weight="bold" />}
                label="Rata-rata"
                value={formatCurrency(summary.avg_transaction)}
                subValue="per transaksi"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
              />
              <SummaryCard
                icon={<ChartBar size={22} weight="bold" />}
                label="Pertumbuhan"
                value={`${summary.growth_pct >= 0 ? '+' : ''}${summary.growth_pct}%`}
                subValue="dari periode sebelumnya"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                iconColor="text-amber-600 dark:text-amber-400"
              />
            </div>

            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase mb-2">
              Revenue per Outlet
            </h2>
            {outlets.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Belum ada data outlet
                </p>
              </div>
            ) : (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left p-3 font-semibold text-xs text-[var(--muted-foreground)] uppercase">
                        Outlet
                      </th>
                      <th className="text-right p-3 font-semibold text-xs text-[var(--muted-foreground)] uppercase">
                        Revenue
                      </th>
                      <th className="text-right p-3 font-semibold text-xs text-[var(--muted-foreground)] uppercase">
                        Transaksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outlets.map((outlet) => (
                      <tr
                        key={outlet.outlet_id}
                        className="border-b border-[var(--border)] last:border-b-0"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Storefront
                              size={16}
                              className="text-[var(--muted-foreground)]"
                            />
                            <span className="font-medium">
                              {outlet.outlet_name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(outlet.revenue)}
                        </td>
                        <td className="p-3 text-right text-[var(--muted-foreground)]">
                          {outlet.transactions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
