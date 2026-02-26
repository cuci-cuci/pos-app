import { Package, Plus, Printer, ShareNetwork } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'
import { TransactionReceipt } from '@/components/receipt/transaction-receipt'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Transaction } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { useDeviceStore } from '@/stores/device-store'

interface SuccessOverlayProps {
  open: boolean
  transaction: Transaction | null
  onNewTransaction: () => void
  onClose: () => void
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b', '#ffffff', '#86efac', '#4ade80']
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      rotation: number
      rotationSpeed: number
      opacity: number
    }[] = []

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 8
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 60,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()) - 3,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }

    let frame = 0
    const maxFrames = 120

    const animate = () => {
      frame++
      if (frame > maxFrames) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.vy += 0.15
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, 1 - frame / maxFrames)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [active])

  if (!active) return null
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
}

export function SuccessOverlay({
  open,
  transaction,
  onNewTransaction,
  onClose,
}: SuccessOverlayProps) {
  const router = useRouter()
  const outletName = useDeviceStore((s) => s.outletName)

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleShare = useCallback(async () => {
    if (!transaction) return
    const lines: string[] = []
    lines.push(outletName || 'kelarin')
    lines.push(`Pesanan #${transaction.orderNumber}`)
    if (transaction.customerName) lines.push(`Pelanggan: ${transaction.customerName}`)
    lines.push('')
    for (const item of transaction.items) {
      lines.push(
        `${item.serviceName} - ${item.quantity} ${item.unit} x ${formatCurrency(item.pricePerUnit)} = ${formatCurrency(item.subtotal)}`,
      )
    }
    lines.push('')
    lines.push(`Total: ${formatCurrency(transaction.totalAmount)}`)
    if (transaction.payments[0]) lines.push(`Pembayaran: ${transaction.payments[0].methodName}`)
    lines.push('')
    lines.push('Terima kasih!')
    const text = lines.join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: `Pesanan #${transaction.orderNumber}`, text })
      } catch {
        await navigator.clipboard.writeText(text).catch(() => {})
      }
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
    }
  }, [transaction, outletName])

  return (
    <AnimatePresence>
      {open && transaction && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Confetti active={open} />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto relative z-20">
            {/* Success animation area */}
            <div className="flex flex-col items-center pt-10 pb-6">
              {/* Animated checkmark */}
              <motion.div
                className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <motion.svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 12l5 5L20 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              <motion.div
                className="text-center mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-xl font-bold">Pembayaran Berhasil!</h2>
                <p className="text-sm text-muted-foreground mt-1">{transaction.orderNumber}</p>
              </motion.div>

              {/* Quick summary */}
              <motion.div
                className="mt-4 bg-muted rounded-xl p-4 mx-4 w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">{transaction.payments[0]?.methodName}</span>
                </div>
                {transaction.payments[0]?.cashTendered !== undefined && (
                  <>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Tunai</span>
                      <span>{formatCurrency(transaction.payments[0].cashTendered)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Kembalian</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(transaction.payments[0].changeAmount ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Order info note */}
              <motion.div
                className="mt-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 mx-4 w-full max-w-sm text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Pesanan laundry akan dibuat otomatis setelah sinkronisasi.
                  {transaction.customerPhone &&
                    ' Notifikasi WhatsApp akan dikirim ke pelanggan.'}
                </p>
              </motion.div>
            </div>

            {/* Receipt section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <p className="text-center text-sm text-muted-foreground mb-3">Struk Transaksi</p>
              <div className="receipt-printable rounded-xl mx-4">
                <TransactionReceipt transaction={transaction} />
              </div>
            </motion.div>

            {/* Spacer for sticky buttons */}
            <div className="h-40" />
          </div>

          {/* Sticky action buttons */}
          <motion.div
            className="sticky bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div className="flex gap-2 mb-2">
              <Button variant="outline" className="flex-1 h-11 gap-2" onClick={handlePrint}>
                <Printer size={18} weight="fill" />
                Cetak
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 gap-2"
                onClick={() => void handleShare()}
              >
                <ShareNetwork size={18} weight="fill" />
                Bagikan
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 gap-2"
                onClick={() => {
                  onClose()
                  void router.navigate({ to: '/orders' })
                }}
              >
                <Package size={18} weight="fill" />
                Pesanan
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full h-12 text-base font-bold gap-2"
              onClick={() => {
                onNewTransaction()
                onClose()
              }}
            >
              <Plus size={20} weight="bold" />
              Transaksi Baru
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
