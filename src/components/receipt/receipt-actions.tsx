import { Check, FilePdf, Printer, ShareNetwork } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { downloadReceiptPdf } from '@/lib/receipt-pdf'
import { isWebSerialSupported, printReceipt } from '@/lib/thermal-printer'
import type { OrderDetail } from '@/services/order-api'
import { useDeviceStore } from '@/stores/device-store'

interface ReceiptActionsProps {
  order: OrderDetail
  receiptRef?: React.RefObject<HTMLDivElement | null>
}

function buildShareText(order: OrderDetail, outletName: string): string {
  const lines: string[] = []
  lines.push(outletName || 'kelarin')
  lines.push(`Pesanan #${order.order_number}`)
  if (order.customer_name) {
    lines.push(`Pelanggan: ${order.customer_name}`)
  }
  lines.push('')

  if (order.transaction) {
    for (const item of order.transaction.items) {
      lines.push(
        `${item.service_name} - ${item.quantity} ${item.unit} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`,
      )
    }
    lines.push('')
    lines.push(`Total: ${formatCurrency(order.transaction.total_amount)}`)
    if (order.transaction.payment_method) {
      lines.push(`Pembayaran: ${order.transaction.payment_method}`)
    }
  }

  lines.push('')
  lines.push('Terima kasih!')
  return lines.join('\n')
}

export function ReceiptActions({ order, receiptRef }: ReceiptActionsProps) {
  const outletName = useDeviceStore((s) => s.outletName)
  const [copied, setCopied] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handlePdf = async () => {
    if (!receiptRef?.current) {
      showToast('Tidak dapat membuat PDF', 'error')
      return
    }
    setIsPdfLoading(true)
    try {
      await downloadReceiptPdf(receiptRef.current, `struk-${order.order_number}`)
    } catch {
      showToast('Gagal membuat PDF', 'error')
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleThermalPrint = async () => {
    const tx = order.transaction
    if (!tx) return

    const success = await printReceipt({
      storeName: outletName || 'kelarin',
      orderNumber: order.order_number,
      date: formatDate(order.created_at),
      time: formatTime(order.created_at),
      customerName: order.customer_name || undefined,
      items: tx.items.map((item) => ({
        name: item.service_name,
        qty: `${item.quantity} ${item.unit}`,
        price: formatCurrency(item.price),
        subtotal: formatCurrency(item.subtotal),
      })),
      subtotal: formatCurrency(tx.subtotal),
      discount: tx.discount > 0 ? formatCurrency(tx.discount) : undefined,
      tax: tx.tax > 0 ? formatCurrency(tx.tax) : undefined,
      total: formatCurrency(tx.total_amount),
      paymentMethod: tx.payment_method || undefined,
    })

    if (!success) {
      showToast('Gagal mencetak. Pastikan printer terhubung.', 'error')
    }
  }

  const handleShare = async () => {
    const text = buildShareText(order, outletName)

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pesanan #${order.order_number}`,
          text,
        })
      } catch {
        await copyToClipboard(text)
      }
    } else {
      await copyToClipboard(text)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
          <Printer size={18} weight="fill" />
          Cetak
        </Button>
        {isWebSerialSupported() && (
          <Button variant="outline" className="flex-1 gap-2" onClick={() => void handleThermalPrint()}>
            <Printer size={18} />
            Thermal
          </Button>
        )}
        <Button variant="outline" className="flex-1 gap-2" onClick={() => void handlePdf()} disabled={isPdfLoading}>
          <FilePdf size={18} weight="fill" />
          PDF
        </Button>
      </div>
      <Button variant="outline" className="gap-2" onClick={() => void handleShare()}>
        {copied ? <Check size={18} weight="bold" /> : <ShareNetwork size={18} weight="fill" />}
        {copied ? 'Tersalin!' : 'Bagikan'}
      </Button>
    </div>
  )
}
