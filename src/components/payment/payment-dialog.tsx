import {
  ArrowLeft,
  Bank,
  CircleNotch,
  type Icon,
  Money,
  QrCode,
  RadioButton,
  Wallet,
  WifiSlash,
} from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
import { useSyncStore } from '@/stores/sync-store'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransactionComplete?: (tx: Transaction) => void
}

type Step = 'method' | 'cash' | 'noncash'

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
  const [step, setStep] = useState<Step>('method')
  const [selectedMethod, setSelectedMethod] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [cashTendered, setCashTendered] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isOnline = useSyncStore((s) => s.isOnline)
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const { items, discountPercent, getSubtotal } = useCartStore()
  const subtotal = getSubtotal()
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const afterDiscount = subtotal - discountAmount

  const tenantConfig = useLiveQuery(() => db.tenantConfig.toCollection().first(), [])
  const taxRate = tenantConfig?.taxRate ?? 0
  const taxAmount = Math.round(afterDiscount * (taxRate / 100))
  const total = afterDiscount + taxAmount

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

  // Deduplicate payment methods by name+type
  const methods = useMemo(() => {
    const defaultMethods = [
      { id: 'cash-default', name: 'Tunai', type: 'cash' },
      { id: 'qris-default', name: 'QRIS', type: 'qris' },
    ]

    if (!paymentMethods || paymentMethods.length === 0) return defaultMethods

    const seen = new Set<string>()
    const unique: { id: string; name: string; type: string }[] = []
    for (const m of paymentMethods) {
      const key = `${m.name}|${m.type}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push({ id: m.id, name: m.name, type: m.type })
      }
    }
    return unique
  }, [paymentMethods])

  // Auto-reset non-cash selection when device goes offline
  useEffect(() => {
    if (!isOnline && selectedMethod && selectedMethod.type !== 'cash') {
      setSelectedMethod(null)
      if (step !== 'method') {
        setStep('method')
      }
    }
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMethod = (method: { id: string; name: string; type: string }) => {
    setSelectedMethod(method)
  }

  const handleProceed = () => {
    if (!selectedMethod) return
    if (!isOnline && selectedMethod.type !== 'cash') {
      setSelectedMethod(null)
      return
    }
    if (selectedMethod.type === 'cash') {
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
    setStep('method')
    setSelectedMethod(null)
    setCashTendered('')
    onOpenChange(false)
  }

  // Order summary component (reused in both mobile and tablet layouts)
  const orderSummary = (
    <div className="space-y-3">
      <div className="bg-muted rounded-xl p-4 font-mono text-sm">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2">
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <span className="break-words">{item.serviceName}</span>
              <span className="text-muted-foreground whitespace-nowrap">{item.quantity} {item.unit}</span>
              <span className="tabular-nums text-right whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-1 font-mono text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {discountPercent > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Diskon ({discountPercent}%)</span>
            <span className="text-destructive tabular-nums">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {taxRate > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pajak ({taxRate}%)</span>
            <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg font-mono">Total</span>
          <span className="font-bold text-2xl tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )

  // Payment method list with radio buttons
  const methodList = (
    <div className="space-y-1.5">
      {!isOnline && (
        <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-[var(--radius)] bg-amber-50 border border-amber-200">
          <WifiSlash size={16} weight="bold" className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Perangkat offline — hanya tunai yang tersedia
          </p>
        </div>
      )}
      {methods.map((method) => {
        const IconComp = methodIcons[method.type] ?? Wallet
        const isSelected = selectedMethod?.id === method.id
        const isCash = method.type === 'cash'
        const isDisabled = !isOnline && !isCash

        return (
          <button
            type="button"
            key={method.id}
            onClick={() => !isDisabled && handleSelectMethod(method)}
            disabled={isDisabled}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] border',
              'min-h-[44px] touch-manipulation',
              isDisabled
                ? 'opacity-40 cursor-not-allowed bg-muted'
                : 'hover:bg-accent active:bg-accent transition-colors',
              isSelected && !isDisabled && 'border-primary bg-primary/5',
            )}
          >
            <IconComp
              size={20}
              weight="fill"
              className={isDisabled ? 'text-muted-foreground' : (methodColors[method.type] ?? 'text-muted-foreground')}
            />
            <span className="text-sm font-medium font-mono flex-1 text-left">{method.name}</span>
            {isDisabled ? (
              <span className="text-[10px] text-muted-foreground">Perlu koneksi</span>
            ) : (
              <RadioButton
                size={20}
                weight={isSelected ? 'fill' : 'regular'}
                className={isSelected ? 'text-primary' : 'text-muted-foreground/40'}
              />
            )}
          </button>
        )
      })}
    </div>
  )

  // Mobile: Sheet bottom sheet
  const mobileContent = (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="max-h-screen overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-4"
            >
              <h2 className="text-lg font-bold">Pembayaran</h2>
              {orderSummary}
              <Separator />
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Metode Pembayaran
              </p>
              {methodList}
              <Button
                size="lg"
                className="w-full h-12 text-base font-bold"
                disabled={!selectedMethod || (!isOnline && selectedMethod.type !== 'cash')}
                onClick={handleProceed}
              >
                Lanjutkan Pembayaran
              </Button>
            </motion.div>
          )}

          {step === 'cash' && (
            <motion.div
              key="cash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 p-6"
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

          {step === 'noncash' && (
            <motion.div
              key="noncash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 p-6"
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

  // Tablet: Dialog modal with stacked layers
  const tabletContent = (
    <Dialog open={open} onOpenChange={handleClose} className="md:max-w-3xl">
      {/* Header layer */}
      <div className="bg-gray-100 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0">
        <p className="text-sm text-muted-foreground">Ringkasan Pesanan</p>
      </div>

      {/* Main card */}
      <DialogContent className="p-0 overflow-hidden relative z-10 rounded-xl">
        <AnimatePresence mode="wait">
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex">
                {/* Left: Order summary — wider */}
                <div className="flex-[3] p-6 min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Detail Item
                  </p>
                  {orderSummary}
                </div>

                {/* Divider */}
                <div className="w-px bg-border shrink-0" />

                {/* Right: Payment methods with radio */}
                <div className="flex-[2] p-6 min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Metode Pembayaran
                  </p>
                  {methodList}
                </div>
              </div>

              {/* Confirm button — full width below both columns */}
              <div className="border-t border-border p-4">
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-bold"
                  disabled={!selectedMethod || (!isOnline && selectedMethod.type !== 'cash')}
                  onClick={handleProceed}
                >
                  Lanjutkan Pembayaran
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'cash' && (
            <motion.div
              key="cash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 p-6"
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

              <div className="grid grid-cols-3 gap-2">
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
                <label htmlFor="cash-amount-input-tablet" className="text-sm font-medium mb-1 block">
                  Jumlah Lainnya
                </label>
                <Input
                  id="cash-amount-input-tablet"
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

          {step === 'noncash' && (
            <motion.div
              key="noncash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 p-6"
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
      </DialogContent>

      {/* Footer layer */}
    </Dialog>
  )

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="md:hidden">{mobileContent}</div>
      {/* Tablet: dialog modal */}
      <div className="hidden md:block">{tabletContent}</div>
    </>
  )
}
