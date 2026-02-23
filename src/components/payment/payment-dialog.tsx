import {
  ArrowLeft,
  Bank,
  CircleNotch,
  type Icon,
  Money,
  QrCode,
  Wallet,
} from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { showToast } from '@/components/ui/toast'
import { db } from '@/db'
import type { PaymentMethod, Transaction } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createTransaction } from '@/services/order-service'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransactionComplete?: (tx: Transaction) => void
}

type Step = 'review' | 'method' | 'cash' | 'noncash'

const methodIcons: Record<string, Icon> = {
  cash: Money,
  qris: QrCode,
  bank_transfer: Bank,
  ewallet: Wallet,
  other: Wallet,
}

const methodColors: Record<string, string> = {
  cash: 'text-success',
  qris: 'text-primary',
  bank_transfer: 'text-info',
  ewallet: 'text-purple-500',
  other: 'text-muted-foreground',
}

export function PaymentDialog({ open, onOpenChange, onTransactionComplete }: PaymentDialogProps) {
  const [step, setStep] = useState<Step>('review')
  const [selectedMethod, setSelectedMethod] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [cashTendered, setCashTendered] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const { items, discountPercent, getSubtotal, getTotal } = useCartStore()
  const total = getTotal()
  const subtotal = getSubtotal()
  const discountAmount = Math.round(subtotal * (discountPercent / 100))

  const paymentMethods = useLiveQuery(
    () =>
      tenantId
        ? db.paymentMethods.where('tenantId').equals(tenantId).toArray()
        : ([] as PaymentMethod[]),
    [tenantId],
  )

  const quickAmounts = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 10rb', value: 10000 },
    { label: 'Rp 20rb', value: 20000 },
    { label: 'Rp 50rb', value: 50000 },
    { label: 'Rp 100rb', value: 100000 },
    { label: 'Rp 200rb', value: 200000 },
  ]

  const cashAmount = parseInt(cashTendered, 10) || 0
  const changeAmount = cashAmount - total

  const handleSelectMethod = (method: { id: string; name: string; type: string }) => {
    setSelectedMethod(method)
    if (method.type === 'cash') {
      setStep('cash')
    } else {
      setStep('noncash')
    }
  }

  const handleConfirmPayment = async (
    method: { id: string; name: string; type: string } = selectedMethod!,
  ) => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const tx = await createTransaction({
        methodId: method.id,
        methodName: method.name,
        methodType: method.type,
        cashTendered: method.type === 'cash' ? cashAmount : undefined,
      })
      handleClose()
      onTransactionComplete?.(tx)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal membuat transaksi', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep('review')
    setSelectedMethod(null)
    setCashTendered('')
    onOpenChange(false)
  }

  const defaultMethods = [
    { id: 'cash-default', name: 'Tunai', type: 'cash' },
    { id: 'qris-default', name: 'QRIS', type: 'qris' },
  ]

  const methods =
    paymentMethods && paymentMethods.length > 0
      ? paymentMethods.map((m) => ({ id: m.id, name: m.name, type: m.type }))
      : defaultMethods

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Review */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold">Ringkasan Pesanan</h2>

              <div className="space-y-2 bg-muted rounded-xl p-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate mr-2">
                      {item.serviceName} x{item.quantity}
                    </span>
                    <span className="shrink-0">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diskon ({discountPercent}%)</span>
                    <span className="text-destructive">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>Rp 0</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-bold mt-4"
                onClick={() => setStep('method')}
              >
                Lanjut ke Pembayaran
              </Button>
            </motion.div>
          )}

          {/* Step 2: Payment Method */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="p-1 rounded hover:bg-accent"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <h2 className="text-lg font-bold">Metode Pembayaran</h2>
              </div>

              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>

              <div className="space-y-3">
                {methods.map((method) => {
                  const IconComp = methodIcons[method.type] ?? Wallet
                  return (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => handleSelectMethod(method)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-[var(--radius)] border',
                        'hover:bg-accent active:bg-accent transition-colors',
                        'min-h-[60px] touch-manipulation',
                      )}
                    >
                      <IconComp
                        size={28}
                        weight="fill"
                        className={methodColors[method.type] ?? 'text-muted-foreground'}
                      />
                      <span className="text-base font-medium">{method.name}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3a: Cash */}
          {step === 'cash' && (
            <motion.div
              key="cash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="p-1 rounded hover:bg-accent"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <h2 className="text-lg font-bold">Pembayaran Tunai</h2>
              </div>

              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    type="button"
                    key={qa.label}
                    onClick={() => setCashTendered(String(qa.value))}
                    className={cn(
                      'px-3 py-3 rounded-xl border text-sm font-medium text-center',
                      'min-h-[48px] touch-manipulation transition-colors',
                      cashAmount === qa.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="cash-amount-input" className="text-sm font-medium mb-1 block">
                  Jumlah Lainnya
                </label>
                <Input
                  id="cash-amount-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="Masukkan nominal..."
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="text-lg h-14 text-center font-semibold"
                />
              </div>

              {cashAmount > 0 && cashAmount >= total && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">Kembalian</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(changeAmount)}
                  </p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-12 text-base font-bold gap-2"
                disabled={cashAmount < total || isProcessing}
                onClick={() => void handleConfirmPayment()}
              >
                {isProcessing && <CircleNotch size={18} weight="bold" className="animate-spin" />}
                {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
              </Button>
            </motion.div>
          )}

          {/* Step 3b: Non-cash */}
          {step === 'noncash' && (
            <motion.div
              key="noncash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="p-1 rounded hover:bg-accent"
                >
                  <ArrowLeft size={20} weight="bold" />
                </button>
                <h2 className="text-lg font-bold">{selectedMethod?.name}</h2>
              </div>

              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
                <p className="text-sm text-muted-foreground mt-4">Menunggu pembayaran...</p>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-bold gap-2"
                disabled={isProcessing}
                onClick={() => void handleConfirmPayment()}
              >
                {isProcessing && <CircleNotch size={18} weight="bold" className="animate-spin" />}
                {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran Diterima'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}
