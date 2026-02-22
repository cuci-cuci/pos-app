import { useState, useEffect } from 'react'
import { useShiftStore } from '@/stores/shift-store'
import { shiftApi } from '@/services/shift-api'
import { formatCurrency } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { LockSimple, CurrencyDollar, Receipt, Warning } from '@phosphor-icons/react'
import type { ShiftSummary } from '@/services/shift-api'

interface CloseShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloseShiftDialog({ open, onOpenChange }: CloseShiftDialogProps) {
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const currentShift = useShiftStore((s) => s.currentShift)
  const closeShift = useShiftStore((s) => s.closeShift)

  useEffect(() => {
    if (open && currentShift) {
      setLoadingSummary(true)
      shiftApi
        .getSummary(currentShift.id)
        .then((res) => setSummary(res.data))
        .catch(() => setSummary(null))
        .finally(() => setLoadingSummary(false))
    }
  }, [open, currentShift])

  const handleClose = async () => {
    setLoading(true)
    try {
      await closeShift({
        closing_cash: Number(closingCash) || 0,
        notes: notes || undefined,
      })
      showToast('Shift berhasil ditutup', 'success')
      onOpenChange(false)
      setClosingCash('')
      setNotes('')
      setSummary(null)
    } catch {
      showToast('Gagal menutup shift', 'error')
    } finally {
      setLoading(false)
    }
  }

  const cashValue = Number(closingCash) || 0
  const expectedCash = summary
    ? (currentShift?.opening_cash ?? 0) + summary.total_revenue
    : currentShift?.opening_cash ?? 0
  const difference = cashValue - expectedCash

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockSimple size={20} />
            Tutup Shift
          </DialogTitle>
          <DialogDescription>
            Hitung kas akhir dan tutup shift Anda.
          </DialogDescription>
        </DialogHeader>

        {loadingSummary ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Memuat ringkasan...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Shift summary */}
            {summary && (
              <div className="bg-muted rounded-[var(--radius)] p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Receipt size={14} />
                    Total Transaksi
                  </span>
                  <span className="font-semibold">{summary.transaction_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Pendapatan</span>
                  <span className="font-semibold">{formatCurrency(summary.total_revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kas Awal</span>
                  <span className="font-semibold">
                    {formatCurrency(currentShift?.opening_cash ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Kas yang Diharapkan</span>
                  <span className="font-bold">{formatCurrency(expectedCash)}</span>
                </div>
              </div>
            )}

            {/* Closing cash input */}
            <div>
              <label htmlFor="closing-cash" className="text-sm font-medium mb-1.5 block">
                Kas Akhir (Aktual)
              </label>
              <div className="relative">
                <CurrencyDollar
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="closing-cash"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="pl-9 text-lg font-semibold"
                  min={0}
                />
              </div>
              {cashValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(cashValue)}
                </p>
              )}
            </div>

            {/* Difference */}
            {closingCash !== '' && (
              <div
                className={`flex items-center justify-between p-3 rounded-[var(--radius)] text-sm font-medium ${
                  difference < 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : difference > 0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {difference !== 0 && <Warning size={16} />}
                  Selisih
                </span>
                <span className="font-bold">{formatCurrency(difference)}</span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="close-notes" className="text-sm font-medium mb-1.5 block">
                Catatan (opsional)
              </label>
              <Input
                id="close-notes"
                placeholder="Catatan akhir shift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleClose}
            disabled={loading || loadingSummary}
          >
            {loading ? 'Menutup...' : 'Tutup Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
