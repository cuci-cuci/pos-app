import { ArrowLeft, DownloadSimple, TrendDown, TrendUp } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { exportCSV } from '@/lib/export'
import { formatCurrency } from '@/lib/format'
import { getPnLReport, getCashFlowReport, type PnLReport, type CashFlowReport } from '@/services/finance-api'

type Period = 'month' | 'quarter' | 'year'

function getPeriodRange(period: Period): { start_date: string; end_date: string; label: string } {
  const now = new Date()
  let start: Date
  let end: Date
  let label: string

  switch (period) {
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      label = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      break
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), q * 3, 1)
      end = new Date(now.getFullYear(), q * 3 + 3, 0)
      label = `Q${q + 1} ${now.getFullYear()}`
      break
    }
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
      label = String(now.getFullYear())
      break
  }

  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    label,
  }
}

export function ManageFinancePnlPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')
  const [pnl, setPnl] = useState<PnLReport | null>(null)
  const [cashflow, setCashflow] = useState<CashFlowReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const range = getPeriodRange(period)
      const [pnlRes, cfRes] = await Promise.all([
        getPnLReport(range.start_date, range.end_date),
        getCashFlowReport(range.start_date, range.end_date),
      ])
      setPnl(pnlRes.data)
      setCashflow(cfRes.data)
    } catch {
      setError('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const periodLabel = getPeriodRange(period).label

  const handleExport = () => {
    if (!pnl) return
    const rows = [
      { item: 'Pendapatan', jumlah: pnl.revenue },
      { item: 'Pengeluaran', jumlah: -pnl.expenses },
      { item: 'Laba Bersih', jumlah: pnl.gross_profit },
      { item: `Margin (%)`, jumlah: pnl.margin_percent },
      ...pnl.expense_by_category.map((c) => ({
        item: `Kategori: ${c.category_name}`,
        jumlah: c.amount,
      })),
    ]
    if (cashflow) {
      rows.push(
        { item: 'Kas Masuk', jumlah: cashflow.cash_in },
        { item: 'Kas Keluar', jumlah: -cashflow.cash_out },
        { item: 'Arus Kas Bersih', jumlah: cashflow.net_flow },
      )
    }
    exportCSV(
      rows,
      [
        { key: 'item', label: 'Item' },
        { key: 'jumlah', label: 'Jumlah' },
      ],
      `laporan-laba-rugi-${periodLabel}`,
    )
  }

  if (loading) return <ManageListSkeleton />
  if (error) return <InlineError message={error} onRetry={fetchData} />

  const chartData = [
    { name: 'Pendapatan', value: pnl?.revenue ?? 0, fill: '#22c55e' },
    { name: 'Pengeluaran', value: pnl?.expenses ?? 0, fill: '#ef4444' },
    { name: 'Laba Bersih', value: pnl?.gross_profit ?? 0, fill: '#3b82f6' },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate({ to: '/manage/finance' as any })}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Laba Rugi</h1>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
        {pnl && (
          <Button size="sm" variant="outline" onClick={handleExport}>
            <DownloadSimple size={16} className="mr-1" /> Export
          </Button>
        )}
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Period selector */}
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {p === 'month' ? 'Bulanan' : p === 'quarter' ? 'Kuartal' : 'Tahunan'}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="border rounded-[var(--radius)] p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* P&L summary */}
        <div className="border rounded-[var(--radius)] p-4 space-y-3">
          <h3 className="text-sm font-semibold">Ringkasan Laba Rugi</h3>
          <Row label="Total Pendapatan" value={pnl?.revenue ?? 0} color="text-green-600" />
          <Row label="Total Pengeluaran" value={-(pnl?.expenses ?? 0)} color="text-red-600" />
          <div className="border-t pt-2">
            <Row
              label="Laba Bersih"
              value={pnl?.gross_profit ?? 0}
              color={(pnl?.gross_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
              bold
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Margin:</span>
            <span className="font-medium flex items-center gap-1">
              {(pnl?.margin_percent ?? 0) >= 0 ? (
                <TrendUp size={14} className="text-green-500" />
              ) : (
                <TrendDown size={14} className="text-red-500" />
              )}
              {(pnl?.margin_percent ?? 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Expense breakdown */}
        {pnl && pnl.expense_by_category.length > 0 && (
          <div className="border rounded-[var(--radius)] p-4 space-y-3">
            <h3 className="text-sm font-semibold">Pengeluaran per Kategori</h3>
            {pnl.expense_by_category.map((item) => (
              <div key={item.category_name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.category_name}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cash flow */}
        {cashflow && (
          <div className="border rounded-[var(--radius)] p-4 space-y-3">
            <h3 className="text-sm font-semibold">Arus Kas</h3>
            <Row label="Kas Masuk" value={cashflow.cash_in} color="text-green-600" />
            <Row label="Kas Keluar" value={-cashflow.cash_out} color="text-red-600" />
            <div className="border-t pt-2">
              <Row
                label="Arus Kas Bersih"
                value={cashflow.net_flow}
                color={cashflow.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}
                bold
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string
  value: number
  color: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${color}`}>
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  )
}
