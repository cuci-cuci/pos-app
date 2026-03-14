import { ArrowLeft, DownloadSimple, Receipt } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { exportCSV } from '@/lib/export'
import { exportExcel } from '@/lib/export-excel'
import { formatCurrency } from '@/lib/format'
import { getTaxReport, type TaxReport } from '@/services/finance-api'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function ManageFinanceTaxPage() {
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState<TaxReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getTaxReport(month, year)
      setReport(res.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleExportCSV = () => {
    if (!report) return
    const rows = report.outlet_breakdown.map((o) => ({
      outlet: o.outlet_name,
      penjualan_kotor: o.gross_sales,
      diskon: o.discount,
      penjualan_bersih: o.net_sales,
      ppn: o.ppn_amount,
      jumlah_transaksi: o.transaction_count,
    }))
    exportCSV(rows, [
      { key: 'outlet', label: 'Outlet' },
      { key: 'penjualan_kotor', label: 'Penjualan Kotor' },
      { key: 'diskon', label: 'Diskon' },
      { key: 'penjualan_bersih', label: 'Penjualan Bersih (DPP)' },
      { key: 'ppn', label: 'PPN 11%' },
      { key: 'jumlah_transaksi', label: 'Jumlah Transaksi' },
    ], `laporan-pajak-${year}-${String(month).padStart(2, '0')}`)
  }

  const handleExportExcel = () => {
    if (!report) return
    exportExcel([
      {
        name: 'Ringkasan',
        columns: [
          { key: 'item', label: 'Item' },
          { key: 'nilai', label: 'Nilai (Rp)' },
        ],
        data: [
          { item: 'Penjualan Kotor', nilai: report.gross_sales },
          { item: 'Total Diskon', nilai: report.total_discount },
          { item: 'Penjualan Bersih (DPP)', nilai: report.net_sales },
          { item: 'PPN 11%', nilai: report.ppn_amount },
          { item: 'Jumlah Transaksi', nilai: report.transaction_count },
        ],
      },
      {
        name: 'Per Outlet',
        columns: [
          { key: 'outlet_name', label: 'Outlet' },
          { key: 'gross_sales', label: 'Penjualan Kotor' },
          { key: 'discount', label: 'Diskon' },
          { key: 'net_sales', label: 'DPP' },
          { key: 'ppn_amount', label: 'PPN 11%' },
          { key: 'transaction_count', label: 'Transaksi' },
        ],
        data: report.outlet_breakdown,
      },
    ], `laporan-pajak-${year}-${String(month).padStart(2, '0')}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => router.history.back()} className="p-1">
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">Laporan Pajak (PPN)</h1>
          <p className="text-xs text-muted-foreground">Ringkasan pajak pertambahan nilai</p>
        </div>
        {report && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleExportCSV}>
              <DownloadSimple size={14} />
              CSV
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleExportExcel}>
              <DownloadSimple size={14} />
              Excel
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Period selector */}
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 h-9 rounded-md border bg-background px-3 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading && <ManageListSkeleton />}
        {error && <InlineError message="Gagal memuat data pajak" onRetry={fetchData} />}

        {report && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Penjualan Kotor</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(report.gross_sales)}</p>
              </div>
              <div className="bg-card border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">DPP</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(report.taxable_base)}</p>
              </div>
              <div className="bg-card border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">PPN 11%</p>
                <p className="text-lg font-bold text-red-600 mt-1">{formatCurrency(report.ppn_amount)}</p>
              </div>
              <div className="bg-card border rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Transaksi</p>
                <p className="text-lg font-bold mt-1">{report.transaction_count.toLocaleString()}</p>
              </div>
            </div>

            {/* Detail breakdown */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Detail Perhitungan</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Penjualan Kotor</span>
                  <span>{formatCurrency(report.gross_sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Diskon</span>
                  <span className="text-red-500">-{formatCurrency(report.total_discount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>DPP (Dasar Pengenaan Pajak)</span>
                  <span>{formatCurrency(report.taxable_base)}</span>
                </div>
                <div className="flex justify-between font-semibold text-red-600">
                  <span>PPN 11%</span>
                  <span>{formatCurrency(report.ppn_amount)}</span>
                </div>
              </div>
            </div>

            {/* Per outlet */}
            {report.outlet_breakdown.length > 0 && (
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-sm font-semibold">Per Outlet</h3>
                </div>
                <div className="divide-y">
                  {report.outlet_breakdown.map((o) => (
                    <div key={o.outlet_id} className="px-4 py-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{o.outlet_name}</span>
                        <span className="text-xs text-muted-foreground">{o.transaction_count} tx</span>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>DPP: {formatCurrency(o.net_sales)}</span>
                        <span className="text-red-500">PPN: {formatCurrency(o.ppn_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
