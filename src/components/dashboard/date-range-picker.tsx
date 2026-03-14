import {
  ArrowsLeftRight,
  CalendarBlank,
  MagnifyingGlass,
  TrendDown,
  TrendUp,
} from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  getSummaryRange,
  type DateRangeSummary,
} from '@/services/dashboard-api'

interface DateRangePickerProps {
  outletId?: string
}

export function DateRangePicker({ outletId }: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = `${today.slice(0, 7)}-01`

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [showComparison, setShowComparison] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DateRangeSummary | null>(null)
  const [error, setError] = useState(false)

  const handleFetch = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    setError(false)
    try {
      const res = await getSummaryRange(startDate, endDate, outletId)
      setData(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, outletId])

  function growthBadge(current: number, previous: number) {
    if (previous === 0) return null
    const pct = ((current - previous) / previous) * 100
    const isUp = pct >= 0
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold',
          isUp ? 'text-success' : 'text-destructive',
        )}
      >
        {isUp ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
        {isUp ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="bg-card border rounded-[var(--radius)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarBlank size={16} weight="fill" className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">
          Ringkasan Periode
        </h3>
      </div>

      {/* Date inputs */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-muted-foreground block mb-1">Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            className="w-full text-sm bg-background border border-input rounded-[var(--radius)] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-muted-foreground block mb-1">Sampai</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={today}
            className="w-full text-sm bg-background border border-input rounded-[var(--radius)] px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFetch} disabled={loading} className="shrink-0">
          <MagnifyingGlass size={14} weight="bold" className="mr-1" />
          {loading ? 'Memuat...' : 'Lihat'}
        </Button>
      </div>

      {/* Comparison toggle */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowComparison((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-[var(--radius)] transition-colors',
            showComparison
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <ArrowsLeftRight size={12} weight="bold" />
          Bandingkan dengan periode sebelumnya
        </button>
      </div>

      {/* Error state */}
      {error && (
        <p className="text-sm text-destructive mt-3">Gagal memuat data. Coba lagi.</p>
      )}

      {/* Results */}
      {data && !error && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <ResultCard
              label="Revenue"
              value={formatCurrency(data.revenue)}
              comparison={showComparison ? growthBadge(data.revenue, data.prev_revenue) : null}
              subValue={showComparison ? `Sblm: ${formatCurrency(data.prev_revenue)}` : undefined}
            />
            <ResultCard
              label="Transaksi"
              value={String(data.transactions)}
              comparison={showComparison ? growthBadge(data.transactions, data.prev_transactions) : null}
              subValue={showComparison ? `Sblm: ${data.prev_transactions}` : undefined}
            />
            <ResultCard
              label="Pengeluaran"
              value={formatCurrency(data.expenses)}
              comparison={
                showComparison
                  ? growthBadge(data.expenses, data.prev_expenses)
                  : null
              }
              subValue={showComparison ? `Sblm: ${formatCurrency(data.prev_expenses)}` : undefined}
            />
            <ResultCard
              label="Profit"
              value={formatCurrency(data.profit)}
              comparison={showComparison ? growthBadge(data.profit, data.prev_profit) : null}
              subValue={showComparison ? `Sblm: ${formatCurrency(data.prev_profit)}` : undefined}
            />
          </div>

          {showComparison && data.revenue_growth_pct !== 0 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              Pertumbuhan revenue:{' '}
              <span
                className={cn(
                  'font-semibold',
                  data.revenue_growth_pct >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {data.revenue_growth_pct >= 0 ? '+' : ''}
                {data.revenue_growth_pct.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultCard({
  label,
  value,
  subValue,
  comparison,
}: {
  label: string
  value: string
  subValue?: string
  comparison?: React.ReactNode
}) {
  return (
    <div className="bg-muted/50 rounded-[var(--radius)] p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <p className="text-sm font-bold truncate">{value}</p>
        {comparison}
      </div>
      {subValue && <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  )
}
