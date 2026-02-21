import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { PaymentMethod } from '@/db/schema'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { createTransaction } from '@/services/order-service'
import { formatCurrency } from '@/lib/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/components/ui/toast'
import {
  Money,
  QrCode,
  CheckCircle,
  ArrowLeft,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/db/schema'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'method' | 'cash' | 'success'

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const [step, setStep] = useState<Step>('method')
  const [selectedMethod, setSelectedMethod] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [cashTendered, setCashTendered] = useState('')
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const total = useCartStore((s) => s.getTotal())

  const paymentMethods = useLiveQuery(
    () =>
      tenantId
        ? db.paymentMethods.where('tenantId').equals(tenantId).toArray()
        : ([] as PaymentMethod[]),
    [tenantId]
  )

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total)

  const cashAmount = parseInt(cashTendered, 10) || 0
  const changeAmount = cashAmount - total

  const handleSelectMethod = (method: { id: string; name: string; type: string }) => {
    setSelectedMethod(method)
    if (method.type === 'cash') {
      setStep('cash')
    } else {
      void handleConfirmPayment(method)
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
    setStep('method')
    setSelectedMethod(null)
    setCashTendered('')
    setCompletedTx(null)
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {step === 'method' && (
          <>
            <DialogHeader>
              <DialogTitle>Pembayaran</DialogTitle>
            </DialogHeader>

            <div className="text-center py-4">
              <p className="text-sm text-[var(--muted-foreground)]">Total Pembayaran</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
            </div>

            <Separator />

            <div className="space-y-3 mt-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Metode Pembayaran
              </p>
              {methods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-[var(--radius)] border border-[var(--border)]',
                    'hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors',
                    'min-h-[56px] touch-manipulation'
                  )}
                >
                  {method.type === 'cash' ? (
                    <Money size={28} className="text-green-600" weight="duotone" />
                  ) : (
                    <QrCode size={28} className="text-[var(--primary)]" weight="duotone" />
                  )}
                  <span className="text-base font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'cash' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('method')}
                  className="p-1 rounded hover:bg-[var(--accent)]"
                >
                  <ArrowLeft size={20} />
                </button>
                <DialogTitle>Pembayaran Tunai</DialogTitle>
              </div>
            </DialogHeader>

            <div className="text-center py-2">
              <p className="text-sm text-[var(--muted-foreground)]">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3 mt-2">
              <label className="text-sm font-medium">Uang Diterima</label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Masukkan nominal..."
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="text-lg h-14 text-center font-semibold"
                autoFocus
              />

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashTendered(String(amount))}
                    className={cn(
                      'px-4 py-2.5 rounded-[var(--radius)] border text-sm font-medium',
                      'hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors',
                      'min-h-[44px] touch-manipulation',
                      cashAmount === amount
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                        : 'border-[var(--border)]'
                    )}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>

              {cashAmount > 0 && cashAmount >= total && (
                <div className="bg-[var(--success)]/10 rounded-[var(--radius)] p-3 text-center">
                  <p className="text-sm text-[var(--muted-foreground)]">Kembalian</p>
                  <p className="text-xl font-bold text-[var(--success)]">
                    {formatCurrency(changeAmount)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold"
                disabled={cashAmount < total || isProcessing}
                onClick={() => void handleConfirmPayment()}
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && completedTx && (
          <>
            <div className="text-center py-6">
              <CheckCircle
                size={64}
                className="text-[var(--success)] mx-auto mb-4"
                weight="fill"
              />
              <h2 className="text-xl font-bold mb-1">Pembayaran Berhasil!</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {completedTx.orderNumber}
              </p>
            </div>

            <div className="space-y-2 bg-[var(--muted)] rounded-[var(--radius)] p-4">
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

            <div className="mt-4">
              <Button size="lg" className="w-full h-14" onClick={handleClose}>
                Selesai
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
