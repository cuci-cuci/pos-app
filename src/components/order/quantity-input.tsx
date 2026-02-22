import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface QuantityInputProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string
  unit: string
  pricePerUnit: number
  currentCartQuantity?: number
  onConfirm: (quantity: number) => void
}

export function QuantityInput({
  open,
  onOpenChange,
  serviceName,
  unit,
  pricePerUnit,
  currentCartQuantity,
  onConfirm,
}: QuantityInputProps) {
  const isKg = unit === 'kg'
  const step = isKg ? 0.5 : 1
  const presets = isKg ? [0.5, 1, 1.5, 2, 3, 5] : [1, 2, 3, 5, 10]

  const [quantity, setQuantity] = useState(currentCartQuantity ?? step)
  const [customInput, setCustomInput] = useState('')

  const subtotal = Math.round(quantity * pricePerUnit)

  const handleIncrement = () => {
    setQuantity((prev) => Math.round((prev + step) * 10) / 10)
  }

  const handleDecrement = () => {
    setQuantity((prev) => {
      const next = Math.round((prev - step) * 10) / 10
      return next >= step ? next : step
    })
  }

  const handlePreset = (value: number) => {
    setQuantity(value)
    setCustomInput('')
  }

  const handleCustomChange = (value: string) => {
    setCustomInput(value)
    const parsed = parseFloat(value)
    if (!Number.isNaN(parsed) && parsed > 0) {
      setQuantity(parsed)
    }
  }

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(step)
    setCustomInput('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{serviceName}</DialogTitle>
        </DialogHeader>

        {/* Price per unit */}
        <p className="text-sm text-muted-foreground">
          {formatCurrency(pricePerUnit)} / {unit}
        </p>

        {currentCartQuantity && currentCartQuantity > 0 && (
          <p className="text-xs text-primary">
            Sudah di keranjang: {currentCartQuantity} {unit}
          </p>
        )}

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {presets.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => handlePreset(value)}
              className={cn(
                'px-4 py-2 rounded-[var(--radius)] border text-sm font-medium',
                'min-h-[40px] touch-manipulation transition-colors',
                quantity === value && !customInput
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              {value} {unit}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="mt-3">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Jumlah lainnya..."
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Quantity stepper */}
        <div className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            onClick={handleDecrement}
            className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center active:bg-accent touch-manipulation"
          >
            <Minus size={22} />
          </button>

          <div className="text-center">
            <span className="text-3xl font-bold">{quantity}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            className="w-12 h-12 rounded-full border-2 border-primary text-primary flex items-center justify-center active:bg-primary/10 touch-manipulation"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</p>
        </div>

        {/* Confirm button */}
        <Button
          size="lg"
          className="w-full h-12 text-base font-bold"
          onClick={handleConfirm}
        >
          {currentCartQuantity ? 'Perbarui' : 'Tambah ke Keranjang'} &middot; {formatCurrency(subtotal)}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
