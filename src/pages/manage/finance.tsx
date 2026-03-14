import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CaretRight,
  CurrencyCircleDollar,
  Receipt,
  Repeat,
  TrendUp,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { getPnLReport, type PnLReport } from '@/services/finance-api'

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function ManageFinancePage() {
  const router = useRouter()
  const [report, setReport] = useState<PnLReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { start_date, end_date } = getMonthRange()
      const res = await getPnLReport(start_date, end_date)
      setReport(res.data)
    } catch {
      setError('Gagal memuat laporan keuangan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  if (loading) return <ManageListSkeleton />
  if (error) return <InlineError message={error} onRetry={fetchReport} />

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Keuangan</h1>
          <p className="text-sm text-muted-foreground">Bulan ini</p>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Pendapatan"
            value={formatCurrency(report?.revenue ?? 0)}
            icon={<ArrowUp size={16} className="text-green-500" />}
            color="text-green-600"
          />
          <SummaryCard
            label="Pengeluaran"
            value={formatCurrency(report?.expenses ?? 0)}
            icon={<ArrowDown size={16} className="text-red-500" />}
            color="text-red-600"
          />
          <SummaryCard
            label="Laba Bersih"
            value={formatCurrency(report?.gross_profit ?? 0)}
            icon={<TrendUp size={16} className="text-blue-500" />}
            color={(report?.gross_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <SummaryCard
            label="Margin"
            value={`${(report?.margin_percent ?? 0).toFixed(1)}%`}
            icon={<CurrencyCircleDollar size={16} className="text-amber-500" />}
            color="text-foreground"
          />
        </div>

        {/* Menu links */}
        <div className="space-y-2 pt-2">
          <MenuLink
            icon={<Receipt size={20} className="text-primary" />}
            label="Pengeluaran"
            description="Catat dan kelola pengeluaran"
            onClick={() => router.navigate({ to: '/manage/finance/expenses' as any })}
          />
          <MenuLink
            icon={<TrendUp size={20} className="text-emerald-500" />}
            label="Laporan Laba Rugi"
            description="Pendapatan vs pengeluaran per periode"
            onClick={() => router.navigate({ to: '/manage/finance/pnl' as any })}
          />
          <MenuLink
            icon={<Receipt size={20} className="text-amber-500" />}
            label="Laporan Pajak (PPN)"
            description="Ringkasan pajak pertambahan nilai"
            onClick={() => router.navigate({ to: '/manage/finance/tax' as any })}
          />
          <MenuLink
            icon={<Repeat size={20} className="text-violet-500" />}
            label="Pengeluaran Berulang"
            description="Biaya rutin otomatis (sewa, gaji, dll)"
            onClick={() => router.navigate({ to: '/manage/finance/expenses' as any })}
          />
        </div>

        {/* Expense breakdown */}
        {report && report.expense_by_category.length > 0 && (
          <div className="border rounded-[var(--radius)] p-4 space-y-3">
            <h3 className="text-sm font-semibold">Pengeluaran per Kategori</h3>
            {report.expense_by_category.map((item) => (
              <div key={item.category_name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.category_name}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="border rounded-[var(--radius)] p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function MenuLink({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border rounded-[var(--radius)] p-4 active:bg-muted transition-colors touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-[var(--radius)] bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <CaretRight size={18} weight="bold" className="shrink-0 text-muted-foreground" />
      </div>
    </button>
  )
}
