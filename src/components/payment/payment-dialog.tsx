import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { PaymentMethod, Transaction } from '@/db/schema'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { createTransaction } from '@/services/order-service'
import { formatCurrency } from '@/lib/format'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/components/ui/toast'
import {
  Money,
  QrCode,
  Bank,
  Wallet,
  CheckCircle,
  ArrowLeft,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'review' | 'method' | 'cash' | 'noncash' | 'success'

const methodIcons: Record<string, typeof Money> = {
  cash: Money,
  qris: QrCode,
  bank_transfer: Bank,
  ewallet: Wallet,
  other: Wallet,
}

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('review')
  const [selectedMethod, setSelectedMethod] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [cashTendered, setCashTendered] = useState('')
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null)
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
    [tenantId]
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
    method: { id: string; name: string; type: string } = selectedMethod!
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
      setCompletedTx(tx)
      setStep('success')
      showToast('Transaksi berhasil!', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Gagal membuat transaksi',
        'error'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep('review')
    setSelectedMethod(null)
    setCashTendered('')
    setCompletedTx(null)
    onOpenChange(false)
  }

  const handleNewTransaction = () => {
    handleClose()
  }

  const handleViewDetail = () => {
    if (completedTx) {
      handleClose()
      void router.navigate({ to: '/transactions/$id', params: { id: completedTx.id } })
    }
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
      <SheetContent className="max-h-screen">
        {/* Step 1: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Ringkasan Pesanan</h2>

            <div className="space-y-2 bg-[var(--muted)] rounded-xl p-4">
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
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Diskon ({discountPercent}%)</span>
                  <span className="text-[var(--destructive)]">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Pajak</span>
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
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 'method' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('review')}
                className="p-1 rounded hover:bg-[var(--accent)]"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-bold">Metode Pembayaran</h2>
            </div>

            <div className="text-center py-2">
              <p className="text-sm text-[var(--muted-foreground)]">Total Pembayaran</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              {methods.map((method) => {
                const IconComp = methodIcons[method.type] ?? Wallet
                return (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--border)]',
                      'hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors',
                      'min-h-[60px] touch-manipulation'
                    )}
                  >
                    <IconComp
                      size={28}
                      className={method.type === 'cash' ? 'text-green-600' : 'text-[var(--primary)]'}
                      weight="duotone"
                    />
                    <span className="text-base font-medium">{method.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3a: Cash */}
        {step === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('method')}
                className="p-1 rounded hover:bg-[var(--accent)]"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-bold">Pembayaran Tunai</h2>
            </div>

            <div className="text-center py-2">
              <p className="text-sm text-[var(--muted-foreground)]">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => setCashTendered(String(qa.value))}
                  className={cn(
                    'px-3 py-3 rounded-xl border text-sm font-medium text-center',
                    'min-h-[48px] touch-manipulation transition-colors',
                    cashAmount === qa.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:bg-[var(--accent)]'
                  )}
                >
                  {qa.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Jumlah Lainnya</label>
              <Input
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
                <p className="text-sm text-[var(--muted-foreground)]">Kembalian</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(changeAmount)}
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-12 text-base font-bold"
              disabled={cashAmount < total || isProcessing}
              onClick={() => void handleConfirmPayment()}
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </Button>
          </div>
        )}

        {/* Step 3b: Non-cash */}
        {step === 'noncash' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('method')}
                className="p-1 rounded hover:bg-[var(--accent)]"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-bold">{selectedMethod?.name}</h2>
            </div>

            <div className="text-center py-8">
              <p className="text-sm text-[var(--muted-foreground)]">Total Pembayaran</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-4">
                Menunggu pembayaran...
              </p>
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-base font-bold"
              disabled={isProcessing}
              onClick={() => void handleConfirmPayment()}
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran Diterima'}
            </Button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && completedTx && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <CheckCircle
                size={80}
                className="text-green-500 mx-auto mb-4"
                weight="fill"
              />
              <h2 className="text-xl font-bold mb-1">Pembayaran Berhasil!</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {completedTx.orderNumber}
              </p>
            </div>

            <div className="space-y-2 bg-[var(--muted)] rounded-xl p-4">
              {completedTx.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.serviceName} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(completedTx.totalAmount)}</span>
              </div>
              {completedTx.payments[0]?.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Tunai</span>
                    <span>{formatCurrency(completedTx.payments[0].cashTendered)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kembalian</span>
                    <span>{formatCurrency(completedTx.payments[0].changeAmount ?? 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                size="lg"
                className="flex-1 h-12 text-base font-bold"
                onClick={handleNewTransaction}
              >
                Transaksi Baru
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-base font-bold"
                onClick={handleViewDetail}
              >
                Lihat Detail
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
