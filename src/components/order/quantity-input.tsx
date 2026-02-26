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

  const handleNumpadClear = useCallback(() => {
    setNumpadValue('')
    setCustomInput('')
    setQuantity(step)
  }, [step])

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(step)
    setCustomInput('')
    setNumpadValue('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="md:max-w-2xl">
      <DialogContent className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Column 1: Service info, presets, stepper */}
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

            {/* Confirm button */}
            <Button size="lg" className="w-full h-12 text-base font-bold" onClick={handleConfirm}>
              {currentCartQuantity ? 'Perbarui' : 'Tambah ke Keranjang'} &middot;{' '}
              {formatCurrency(subtotal)}
            </Button>
          </div>

          {/* Column 2: Numpad — tablet only */}
          <div className="hidden md:flex flex-col border-l border-border bg-muted/30 p-4 w-[240px] shrink-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Kalkulator
            </p>

            {/* Numpad display */}
            <div className="bg-card border rounded-lg px-3 py-2.5 mb-3 min-h-[48px] flex items-center">
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

            {/* Numpad grid */}
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              {NUMPAD_KEYS.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleNumpadKey(key)}
                  className="h-12 rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation"
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
                  'h-12 rounded-lg bg-card border text-lg font-semibold transition-colors touch-manipulation',
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
                className="h-12 rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleNumpadKey('backspace')}
                className="h-12 rounded-lg bg-card border text-lg font-semibold hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation flex items-center justify-center"
              >
                <Backspace size={20} weight="bold" />
              </button>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleNumpadClear}
              className="mt-2 h-10 rounded-lg bg-card border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-manipulation"
            >
              Hapus
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
