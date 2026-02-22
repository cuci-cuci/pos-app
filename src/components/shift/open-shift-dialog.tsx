import { useState } from 'react'
import { useDeviceStore } from '@/stores/device-store'
import { useShiftStore } from '@/stores/shift-store'
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
import { LockOpen, DollarSign } from 'lucide-react'

interface OpenShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const QUICK_AMOUNTS = [0, 100_000, 200_000, 500_000]

export function OpenShiftDialog({ open, onOpenChange }: OpenShiftDialogProps) {
  const [openingCash, setOpeningCash] = useState('')
  const [loading, setLoading] = useState(false)
  const outletId = useDeviceStore((s) => s.outletId)
  const openShift = useShiftStore((s) => s.openShift)

  const handleOpen = async () => {
    if (!outletId) {
      showToast('Outlet belum dipilih. Silakan setup ulang.', 'error')
      return
    }
    setLoading(true)
    try {
      await openShift({
        outlet_id: outletId,
        opening_cash: Number(openingCash) || 0,
      })
      showToast('Shift berhasil dibuka', 'success')
      onOpenChange(false)
      setOpeningCash('')
    } catch {
      showToast('Gagal membuka shift', 'error')
    } finally {
      setLoading(false)
    }
  }

  const cashValue = Number(openingCash) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen size={20} />
            Buka Shift
          </DialogTitle>
          <DialogDescription>
            Masukkan jumlah kas awal di laci kasir untuk memulai shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="opening-cash" className="text-sm font-medium mb-1.5 block">
              Kas Awal
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="opening-cash"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
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

          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setOpeningCash(amount.toString())}
                className="px-3 py-1.5 text-xs font-medium rounded-[var(--radius)] border bg-muted hover:bg-accent transition-colors"
              >
                {amount === 0 ? 'Rp 0' : formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button onClick={handleOpen} disabled={loading}>
            {loading ? 'Membuka...' : 'Buka Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
