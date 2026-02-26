import { Backspace, Minus, Plus } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

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
  const [numpadValue, setNumpadValue] = useState('')

  const subtotal = Math.round(quantity * pricePerUnit)

  const handleIncrement = () => {
    setQuantity((prev) => Math.round((prev + step) * 10) / 10)
    setCustomInput('')
    setNumpadValue('')
  }

  const handleDecrement = () => {
    setQuantity((prev) => {
      const next = Math.round((prev - step) * 10) / 10
      return next >= step ? next : step
    })
    setCustomInput('')
    setNumpadValue('')
  }

  const handlePreset = (value: number) => {
    setQuantity(value)
    setCustomInput('')
    setNumpadValue('')
  }

  const handleCustomChange = (value: string) => {
    setCustomInput(value)
    setNumpadValue('')
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed) && parsed > 0) {
      setQuantity(parsed)
    }
  }

  const applyNumpadValue = useCallback(
    (val: string) => {
      setNumpadValue(val)
      setCustomInput('')
      const parsed = Number.parseFloat(val)
      if (!Number.isNaN(parsed) && parsed > 0) {
        setQuantity(parsed)
      }
    },
    [],
  )

  const handleNumpadKey = useCallback(
    (key: string) => {
      setNumpadValue((prev) => {
        let next: string
        if (key === 'backspace') {
          next = prev.slice(0, -1)
        } else if (key === '.') {
          if (!isKg || prev.includes('.')) return prev
          next = prev === '' ? '0.' : `${prev}.`
        } else if (key === '0') {
          if (prev === '0') return prev
          next = prev + key
        } else {
          next = prev + key
        }
        // Apply immediately
        setTimeout(() => applyNumpadValue(next), 0)
        return next
      })
    },
    [isKg, applyNumpadValue],
  )

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(step)
    setCustomInput('')
    setNumpadValue('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="md:max-w-2xl">
      {/* Header layer — stacked behind the card */}
      <div className="bg-gray-100 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0">
        <p className="text-sm text-muted-foreground">Detail Layanan</p>
      </div>

      {/* Main card */}
      <DialogContent className="p-0 overflow-hidden relative z-10 rounded-xl">
        <div className="flex flex-col md:flex-row">
          {/* Column 1: Presets, stepper */}
          <div className="flex-1 p-6">
            <DialogHeader>
              <DialogTitle>{serviceName}</DialogTitle>
            </DialogHeader>

            {/* Price per unit */}
            <p className="text-sm text-muted-foreground">
              {formatCurrency(pricePerUnit)} / {unit}
            </p>

            {currentCartQuantity && currentCartQuantity > 0 && (
              <p className="text-xs text-primary mt-1">
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
                    quantity === value && !customInput && !numpadValue
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-accent',
                  )}
                >
                  {value} {unit}
                </button>
              ))}
            </div>

            {/* Custom input — mobile only (tablet uses numpad) */}
            <div className="mt-3 md:hidden">
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
                <Minus size={22} weight="bold" />
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
                <Plus size={22} weight="bold" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-center mb-2">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</p>
            </div>

            {/* Confirm button — mobile only (tablet has it below both columns) */}
            <div className="md:hidden">
              <Button size="lg" className="w-full h-12 text-base font-bold" onClick={handleConfirm}>
                {currentCartQuantity ? 'Perbarui' : 'Tambah ke Keranjang'} &middot;{' '}
                {formatCurrency(subtotal)}
              </Button>
            </div>
          </div>

          {/* Column 2: Numpad — tablet only */}
          <div className="hidden md:flex flex-col border-l border-border bg-muted/30 p-4 w-[260px] shrink-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Jumlah Kustom
            </p>

            {/* Numpad display */}
            <div className="bg-card border rounded-lg px-3 py-2.5 mb-3 flex items-center">
              <span
                className={cn(
                  'text-2xl font-bold flex-1 text-right tabular-nums',
                  numpadValue ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {numpadValue || '0'}
              </span>
              <span className="text-xs text-muted-foreground ml-2">{unit}</span>
            </div>

            {/* Numpad grid — fills remaining height */}
            <div className="grid grid-cols-3 grid-rows-4 gap-1.5 flex-1 min-h-0">
              {NUMPAD_KEYS.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleNumpadKey(key)}
                  className="rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation"
                >
                  {key}
                </button>
              ))}
              {/* Bottom row */}
              <button
                type="button"
                onClick={() => handleNumpadKey('.')}
                disabled={!isKg}
                className={cn(
                  'rounded-lg bg-card border text-lg font-semibold transition-colors touch-manipulation',
                  isKg
                    ? 'hover:bg-accent active:bg-accent/80'
                    : 'opacity-30 cursor-not-allowed',
                )}
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleNumpadKey('0')}
                className="rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleNumpadKey('backspace')}
                className="rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation flex items-center justify-center"
              >
                <Backspace size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Confirm button — tablet: full-width row below both columns */}
        <div className="hidden md:block border-t border-border p-4">
          <Button size="lg" className="w-full h-12 text-base font-bold" onClick={handleConfirm}>
            {currentCartQuantity ? 'Perbarui' : 'Tambah ke Keranjang'} &middot;{' '}
            {formatCurrency(subtotal)}
          </Button>
        </div>
      </DialogContent>

      {/* Footer layer — stacked behind the card */}
      <div className="bg-gray-100 rounded-b-xl px-5 pt-6 pb-3 -mt-3 relative z-0" />
    </Dialog>
  )
}
