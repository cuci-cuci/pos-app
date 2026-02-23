import { CheckCircle, CurrencyDollar, Lock, Receipt, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { ShiftSummary as ShiftSummaryView } from '@/components/shift/shift-summary'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/format'
import type { ShiftSummary } from '@/services/shift-api'
import { shiftApi } from '@/services/shift-api'
import { useShiftStore } from '@/stores/shift-store'

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
  const [closedSummary, setClosedSummary] = useState<ShiftSummary | null>(null)

  const currentShift = useShiftStore((s) => s.currentShift)
  const closeShift = useShiftStore((s) => s.closeShift)

  useEffect(() => {
    if (open && currentShift) {
      setClosedSummary(null)
      setLoadingSummary(true)
      shiftApi
        .getSummary(currentShift.id)
        .then((res) => setSummary(res.data))
        .catch(() => setSummary(null))
        .finally(() => setLoadingSummary(false))
    }
  }, [open, currentShift])

  const handleClose = async () => {
    if (!currentShift) return
    setLoading(true)
    try {
      await closeShift({
        closing_cash: Number(closingCash) || 0,
        notes: notes || undefined,
      })
      // Fetch the closed shift summary with full details
      try {
        const res = await shiftApi.getSummary(currentShift.id)
        setClosedSummary(res.data)
      } catch {
        // If fetching summary fails, just dismiss
        showToast('Shift berhasil ditutup', 'success')
        handleDismiss()
      }
    } catch {
      showToast('Gagal menutup shift', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    onOpenChange(false)
    setClosingCash('')
    setNotes('')
    setSummary(null)
    setClosedSummary(null)
  }

  const cashValue = Number(closingCash) || 0
  const expectedCash = summary
    ? (currentShift?.opening_cash ?? 0) + summary.total_revenue
    : (currentShift?.opening_cash ?? 0)
  const difference = cashValue - expectedCash

  return (
    <Dialog open={open} onOpenChange={closedSummary ? handleDismiss : onOpenChange}>
      <DialogContent className={closedSummary ? 'max-h-[90vh] overflow-y-auto' : ''}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={20} weight="fill" />
            Tutup Shift
          </DialogTitle>
          <DialogDescription>Hitung kas akhir dan tutup shift Anda.</DialogDescription>
        </DialogHeader>

        {closedSummary ? (
          <>
            {/* Post-close success view */}
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <CheckCircle size={48} weight="fill" className="text-green-500" />
                <p className="text-sm text-muted-foreground">Shift berhasil ditutup</p>
              </div>
              <ShiftSummaryView summary={closedSummary} />
            </div>
            <DialogFooter>
              <Button onClick={handleDismiss} className="w-full">
                Selesai
              </Button>
            </DialogFooter>
          </>
        ) : loadingSummary ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Memuat ringkasan...</div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Shift summary */}
              {summary && (
                <div className="bg-muted rounded-[var(--radius)] p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Receipt size={14} weight="fill" />
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
                    weight="fill"
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
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(cashValue)}</p>
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
                    {difference !== 0 && <WarningCircle size={16} weight="fill" />}
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

            <DialogFooter>
              <Button variant="outline" onClick={handleDismiss} disabled={loading}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleClose} disabled={loading || loadingSummary}>
                {loading ? 'Menutup...' : 'Tutup Shift'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
