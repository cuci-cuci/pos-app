import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDeviceStore } from '@/stores/device-store'
import { formatCurrency } from '@/lib/format'
import { Printer, ShareNetwork, Check } from '@phosphor-icons/react'
import type { OrderDetail } from '@/services/order-api'

interface ReceiptActionsProps {
  order: OrderDetail
}

function buildShareText(order: OrderDetail, outletName: string): string {
  const lines: string[] = []
  lines.push(outletName || 'LaundryPOS')
  lines.push(`Pesanan #${order.order_number}`)
  if (order.customer_name) {
    lines.push(`Pelanggan: ${order.customer_name}`)
  }
  lines.push('')

  if (order.transaction) {
    for (const item of order.transaction.items) {
      lines.push(
        `${item.service_name} - ${item.quantity} ${item.unit} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`
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

export function ReceiptActions({ order }: ReceiptActionsProps) {
  const outletName = useDeviceStore((s) => s.outletName)
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
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
        // User cancelled or share failed - fall back to clipboard
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
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={handlePrint}
      >
        <Printer size={18} />
        Cetak Struk
      </Button>
      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={() => void handleShare()}
      >
        {copied ? <Check size={18} /> : <ShareNetwork size={18} />}
        {copied ? 'Tersalin!' : 'Bagikan'}
      </Button>
    </div>
  )
}
