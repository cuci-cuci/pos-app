import { ArrowLeft, DownloadSimple, Plus, Receipt, Trash } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import { exportCSV } from '@/lib/export'
import { exportExcel } from '@/lib/export-excel'
import { formatCurrency, formatDate } from '@/lib/format'
import { parseCurrencyInput, sanitizeCurrencyInput } from '@/lib/format'
import {
  createExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  type Expense,
  type ExpenseCategory,
} from '@/services/finance-api'

export function ManageFinanceExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formAmount, setFormAmount] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formCategory, setFormCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [expRes, catRes] = await Promise.all([
        getExpenses({ per_page: 50 }),
        getExpenseCategories(),
      ])
      setExpenses(expRes.data.data)
      setCategories(catRes.data)
    } catch {
      setError('Gagal memuat data pengeluaran')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    const amount = parseCurrencyInput(formAmount)
    if (amount <= 0) {
      showToast('Masukkan jumlah yang valid', 'error')
      return
    }
    setSubmitting(true)
    try {
      await createExpense({
        amount,
        description: formDesc,
        expense_date: formDate,
        category_id: formCategory || undefined,
      })
      showToast('Pengeluaran berhasil dicatat', 'success')
      setShowForm(false)
      setFormAmount('')
      setFormDesc('')
      setFormCategory('')
      fetchData()
    } catch {
      showToast('Gagal mencatat pengeluaran', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id)
      showToast('Pengeluaran dihapus', 'success')
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch {
      showToast('Gagal menghapus', 'error')
    }
  }

  const expenseColumns = [
    { key: 'tanggal' as const, label: 'Tanggal' },
    { key: 'deskripsi' as const, label: 'Deskripsi' },
    { key: 'kategori' as const, label: 'Kategori' },
    { key: 'jumlah' as const, label: 'Jumlah' },
  ]

  const getExportRows = () =>
    expenses.map((e) => ({
      tanggal: e.expense_date,
      deskripsi: e.description || '-',
      kategori: e.category_name || '-',
      jumlah: e.amount,
    }))

  const handleExportCSV = () => {
    if (expenses.length === 0) return
    exportCSV(getExportRows(), expenseColumns, `pengeluaran-${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportExcel = () => {
    if (expenses.length === 0) return
    exportExcel(
      [{ name: 'Pengeluaran', columns: expenseColumns, data: getExportRows() }],
      `pengeluaran-${new Date().toISOString().split('T')[0]}`,
    )
  }

  if (loading) return <ManageListSkeleton />
  if (error) return <InlineError message={error} onRetry={fetchData} />

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
          <h1 className="text-xl font-bold">Pengeluaran</h1>
        </div>
        <div className="flex gap-2">
          {expenses.length > 0 && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <DownloadSimple size={16} className="mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportExcel}>
                <DownloadSimple size={16} className="mr-1" /> Excel
              </Button>
            </div>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1" /> Tambah
          </Button>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Create form */}
        {showForm && (
          <div className="border rounded-[var(--radius)] p-4 space-y-3 bg-muted/30">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jumlah (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(sanitizeCurrencyInput(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-[var(--radius)] text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
              <input
                type="text"
                placeholder="Beli deterjen, dll"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-[var(--radius)] text-sm bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-[var(--radius)] text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-[var(--radius)] text-sm bg-background"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title="Belum ada pengeluaran"
            description="Catat pengeluaran pertamamu"
          />
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="border rounded-[var(--radius)] p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.description || 'Pengeluaran'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(e.expense_date)}</span>
                    {e.category_name && (
                      <>
                        <span>•</span>
                        <span>{e.category_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(e.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="p-1 text-muted-foreground hover:text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
