import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from '@phosphor-icons/react'

interface QuantityInputProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string
  unit: string
  onConfirm: (quantity: number) => void
}

export function QuantityInput({
  open,
  onOpenChange,
  serviceName,
  unit,
  onConfirm,
}: QuantityInputProps) {
  const isKg = unit === 'kg'
  const step = isKg ? 0.5 : 1
  const [quantity, setQuantity] = useState(step)

  const handleIncrement = () => {
    setQuantity((prev) => Math.round((prev + step) * 10) / 10)
  }

  const handleDecrement = () => {
    setQuantity((prev) => {
      const next = Math.round((prev - step) * 10) / 10
      return next >= step ? next : step
    })
  }

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(step)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{serviceName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-6 py-6">
          <button
            onClick={handleDecrement}
            className="w-14 h-14 rounded-full border-2 border-[var(--border)] flex items-center justify-center active:bg-[var(--accent)] touch-manipulation"
          >
            <Minus size={24} weight="bold" />
          </button>

          <div className="text-center">
            <span className="text-4xl font-bold">{quantity}</span>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{unit}</p>
          </div>

          <button
            onClick={handleIncrement}
            className="w-14 h-14 rounded-full border-2 border-[var(--primary)] text-[var(--primary)] flex items-center justify-center active:bg-[var(--primary)]/10 touch-manipulation"
          >
            <Plus size={24} weight="bold" />
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm}>Tambah ke Keranjang</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
