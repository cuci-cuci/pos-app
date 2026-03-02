import {
  ArrowLeft,
  ArrowSquareOut,
  Bank,
  CheckCircle,
  CircleNotch,
  type Icon,
  Money,
  QrCode,
  RadioButton,
  Timer,
  Wallet,
  WarningCircle,
  WifiSlash,
} from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { showToast } from '@/components/ui/toast'
import { db } from '@/db'
import type { PaymentMethod, Transaction } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { generateId } from '@/lib/id-generator'
import { cn } from '@/lib/utils'
import { GATEWAY_COUNTDOWN_INTERVAL_MS, GATEWAY_MAX_RETRIES, GATEWAY_POLL_INTERVAL_MS } from '@/lib/constants'
import { createGatewayPayment, getGatewayPaymentStatus } from '@/services/gateway-api'
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

type GatewayStep = 'initiating' | 'waiting' | 'paid' | 'expired' | 'error'

function toGatewayType(methodType: string): 'qris' | 'virtual_account' | 'ewallet' | null {
  switch (methodType) {
    case 'qris': return 'qris'
    case 'bank_transfer': return 'virtual_account'
    case 'ewallet': return 'ewallet'
    default: return null
  }
}

function formatTimeLeft(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

  // Gateway payment state
  const [gatewayStep, setGatewayStep] = useState<GatewayStep>('initiating')
  const [gatewayData, setGatewayData] = useState<{
    externalId: string
    paymentUrl: string
    expiresAt: string
  } | null>(null)
  const [gatewayError, setGatewayError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const preIdsRef = useRef<{ transactionId: string; paymentItemId: string } | null>(null)
  const gatewayRetryRef = useRef(0)

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
      // Pre-generate IDs for gateway payment idempotency
      preIdsRef.current = {
        transactionId: generateId(),
        paymentItemId: generateId(),
      }
      gatewayRetryRef.current = 0
      setGatewayStep('initiating')
      setGatewayData(null)
      setGatewayError('')
      setStep('noncash')
    }
  }

  const handleConfirmPayment = async (opts?: {
    gatewayExternalId?: string
    gatewayPaymentUrl?: string
    gatewayStatus?: string
  }) => {
    const method = selectedMethod
    if (!method || isProcessing) return
    setIsProcessing(true)

    try {
      const tx = await createTransaction({
        methodId: method.id,
        methodName: method.name,
        methodType: method.type,
        cashTendered: method.type === 'cash' ? cashAmount : undefined,
        transactionId: preIdsRef.current?.transactionId,
        paymentItemId: preIdsRef.current?.paymentItemId,
        gatewayExternalId: opts?.gatewayExternalId,
        gatewayPaymentUrl: opts?.gatewayPaymentUrl,
        gatewayStatus: opts?.gatewayStatus,
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
    if (isProcessing) return
    setStep('method')
    setSelectedMethod(null)
    setCashTendered('')
    setGatewayStep('initiating')
    setGatewayData(null)
    setGatewayError('')
    preIdsRef.current = null
    onOpenChange(false)
  }

  // Initiate gateway payment when entering noncash step
  const initiateGateway = useCallback(async () => {
    if (!selectedMethod || !preIdsRef.current) return
    const gwType = toGatewayType(selectedMethod.type)
    if (!gwType) {
      // Non-gateway method (e.g. "other") — skip gateway, allow manual confirm
      setGatewayStep('error')
      setGatewayError('Metode ini tidak mendukung pembayaran gateway')
      return
    }

    if (!navigator.onLine) {
      setGatewayStep('error')
      setGatewayError('Tidak ada koneksi internet. Periksa jaringan Anda.')
      return
    }

    setGatewayStep('initiating')
    setGatewayError('')

    try {
      const res = await createGatewayPayment({
        transaction_id: preIdsRef.current.transactionId,
        payment_item_id: preIdsRef.current.paymentItemId,
        gateway_type: gwType,
        amount: total,
      })

      if (res.gateway_payment_url) {
        // Validate expiry timestamp
        if (res.expires_at) {
          const expiresMs = new Date(res.expires_at).getTime()
          if (Number.isNaN(expiresMs) || expiresMs <= Date.now()) {
            setGatewayStep('expired')
            setGatewayError('Pembayaran sudah kedaluwarsa. Silakan coba lagi.')
            return
          }
        }
        setGatewayData({
          externalId: res.external_id,
          paymentUrl: res.gateway_payment_url,
          expiresAt: res.expires_at ?? '',
        })
        setGatewayStep('waiting')
      } else if (res.gateway_status === 'PAID') {
        setGatewayStep('paid')
      } else {
        // ACTIVE but no URL? Shouldn't happen, treat as waiting
        setGatewayData({
          externalId: res.external_id,
          paymentUrl: '',
          expiresAt: res.expires_at ?? '',
        })
        setGatewayStep('waiting')
      }
    } catch (err) {
      setGatewayStep('error')
      setGatewayError(err instanceof Error ? err.message : 'Gagal membuat pembayaran')
    }
  }, [selectedMethod, total])

  useEffect(() => {
    if (step === 'noncash' && gatewayStep === 'initiating' && preIdsRef.current) {
      void initiateGateway()
    }
  }, [step, gatewayStep, initiateGateway])

  // Poll gateway payment status when waiting
  useEffect(() => {
    if (step !== 'noncash' || gatewayStep !== 'waiting' || !gatewayData?.externalId) return

    let cancelled = false
    const externalId = gatewayData.externalId
    const paymentUrl = gatewayData.paymentUrl

    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const status = await getGatewayPaymentStatus(externalId)
        if (cancelled) return
        if (status.gateway_status === 'PAID') {
          setGatewayStep('paid')
          clearInterval(interval)
          void handleConfirmPayment({
            gatewayExternalId: externalId,
            gatewayPaymentUrl: paymentUrl,
            gatewayStatus: 'PAID',
          })
        } else if (status.is_final) {
          setGatewayStep(status.gateway_status === 'EXPIRED' ? 'expired' : 'error')
          setGatewayError(status.gateway_status === 'EXPIRED' ? 'Pembayaran kedaluwarsa' : 'Pembayaran gagal')
          clearInterval(interval)
        }
      } catch {
        // Silently retry on network errors
      }
    }, GATEWAY_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [step, gatewayStep, gatewayData?.externalId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (step !== 'noncash' || gatewayStep !== 'waiting' || !gatewayData?.expiresAt) return

    const expiresAt = new Date(gatewayData.expiresAt).getTime()
    const updateTimeLeft = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setGatewayStep('expired')
        setGatewayError('Pembayaran kedaluwarsa')
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, GATEWAY_COUNTDOWN_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [step, gatewayStep, gatewayData?.expiresAt])

  const handleRetryGateway = () => {
    if (gatewayRetryRef.current >= GATEWAY_MAX_RETRIES) return
    // Generate new payment item ID for retry (reuse transaction ID)
    if (preIdsRef.current) {
      preIdsRef.current.paymentItemId = generateId()
    }
    gatewayRetryRef.current++
    setGatewayStep('initiating')
    setGatewayData(null)
    setGatewayError('')
  }

  // Gateway payment UI (reused in mobile + tablet noncash step)
  const noncashGatewayContent = (
    <>
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

      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">Total Pembayaran</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
      </div>

      {/* Initiating */}
      {gatewayStep === 'initiating' && (
        <div className="flex flex-col items-center py-6 gap-3">
          <CircleNotch size={32} weight="bold" className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memproses pembayaran...</p>
        </div>
      )}

      {/* Waiting for payment */}
      {gatewayStep === 'waiting' && gatewayData && (
        <div className="space-y-4">
          {gatewayData.paymentUrl && (
            <Button
              size="lg"
              className="w-full h-12 text-base font-bold gap-2"
              onClick={() => window.open(gatewayData.paymentUrl, '_blank')}
            >
              <ArrowSquareOut size={20} weight="bold" />
              Buka Halaman Pembayaran
            </Button>
          )}

          {gatewayData.expiresAt && timeLeft > 0 && (
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm",
              timeLeft <= 300 ? "text-amber-600 font-semibold" : "text-muted-foreground"
            )}>
              <Timer size={16} weight="bold" />
              <span>
                {timeLeft <= 300 ? 'Segera berakhir! ' : 'Berlaku '}
                {formatTimeLeft(timeLeft)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 py-3">
            <CircleNotch size={16} weight="bold" className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Menunggu pembayaran...</p>
          </div>
        </div>
      )}

      {/* Payment confirmed */}
      {gatewayStep === 'paid' && (
        <div className="flex flex-col items-center py-6 gap-3">
          <CheckCircle size={48} weight="fill" className="text-green-500" />
          <p className="text-base font-semibold text-green-600">Pembayaran diterima!</p>
          {isProcessing && (
            <div className="flex items-center gap-2">
              <CircleNotch size={16} weight="bold" className="animate-spin" />
              <p className="text-sm text-muted-foreground">Membuat transaksi...</p>
            </div>
          )}
        </div>
      )}

      {/* Expired */}
      {gatewayStep === 'expired' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-6 gap-3">
            <WarningCircle size={48} weight="fill" className="text-amber-500" />
            <p className="text-base font-semibold text-amber-600">Pembayaran kedaluwarsa</p>
            <p className="text-sm text-muted-foreground text-center">
              Batas waktu pembayaran telah habis. Silakan coba lagi.
            </p>
            {gatewayRetryRef.current > 0 && (
              <p className="text-xs text-muted-foreground">
                Percobaan ke-{gatewayRetryRef.current + 1}
                {gatewayRetryRef.current >= GATEWAY_MAX_RETRIES - 1 && ' (terakhir)'}
              </p>
            )}
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base font-bold gap-2"
            onClick={handleRetryGateway}
            disabled={gatewayRetryRef.current >= GATEWAY_MAX_RETRIES}
          >
            {gatewayRetryRef.current >= GATEWAY_MAX_RETRIES ? 'Batas percobaan tercapai' : 'Coba Lagi'}
          </Button>
        </div>
      )}

      {/* Error */}
      {gatewayStep === 'error' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-6 gap-3">
            <WarningCircle size={48} weight="fill" className="text-destructive" />
            <p className="text-base font-semibold text-destructive">Gagal memproses pembayaran</p>
            {gatewayError && (
              <p className="text-sm text-muted-foreground text-center">{gatewayError}</p>
            )}
            {gatewayRetryRef.current > 0 && (
              <p className="text-xs text-muted-foreground">
                Percobaan ke-{gatewayRetryRef.current + 1}
                {gatewayRetryRef.current >= GATEWAY_MAX_RETRIES - 1 && ' (terakhir)'}
              </p>
            )}
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base font-bold gap-2"
            onClick={handleRetryGateway}
            disabled={gatewayRetryRef.current >= GATEWAY_MAX_RETRIES}
          >
            {gatewayRetryRef.current >= GATEWAY_MAX_RETRIES ? 'Batas percobaan tercapai' : 'Coba Lagi'}
          </Button>
        </div>
      )}

      {/* Manual confirm fallback — always available when not auto-confirming */}
      {gatewayStep !== 'paid' && gatewayStep !== 'initiating' && (
        <>
          <div className="flex items-center gap-2 py-1">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">atau</span>
            <Separator className="flex-1" />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 text-base font-bold gap-2"
            disabled={isProcessing}
            onClick={() => void handleConfirmPayment()}
          >
            {isProcessing && <CircleNotch size={18} weight="bold" className="animate-spin" />}
            {isProcessing ? 'Memproses...' : 'Konfirmasi Manual'}
          </Button>
        </>
      )}
    </>
  )

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
              {noncashGatewayContent}
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
              {noncashGatewayContent}
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
