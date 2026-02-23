import { Check, Printer, ShareNetwork } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { useDeviceStore } from '@/stores/device-store'

interface TransactionActionsProps {
  transaction: Transaction
}

function buildShareText(transaction: Transaction, outletName: string): string {
  const lines: string[] = []
  lines.push(outletName || 'LaundryPOS')
  lines.push(`Pesanan #${transaction.orderNumber}`)
  if (transaction.customerName) {
    lines.push(`Pelanggan: ${transaction.customerName}`)
  }
  lines.push('')

  for (const item of transaction.items) {
    lines.push(
      `${item.serviceName} - ${item.quantity} ${item.unit} x ${formatCurrency(item.pricePerUnit)} = ${formatCurrency(item.subtotal)}`,
    )
  }
  lines.push('')
  lines.push(`Subtotal: ${formatCurrency(transaction.subtotal)}`)
  if (transaction.discountAmount > 0) {
    lines.push(
      `Diskon (${transaction.discountPercent}%): -${formatCurrency(transaction.discountAmount)}`,
    )
  }
  if (transaction.taxAmount > 0) {
    lines.push(`Pajak: ${formatCurrency(transaction.taxAmount)}`)
  }
  lines.push(`Total: ${formatCurrency(transaction.totalAmount)}`)

  const payment = transaction.payments[0]
  if (payment) {
    lines.push(`Pembayaran: ${payment.methodName}`)
    if (payment.cashTendered !== undefined) {
      lines.push(`Tunai: ${formatCurrency(payment.cashTendered)}`)
      lines.push(`Kembalian: ${formatCurrency(payment.changeAmount ?? 0)}`)
    }
  }

  lines.push('')
  lines.push('Terima kasih!')
  return lines.join('\n')
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const outletName = useDeviceStore((s) => s.outletName)
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const text = buildShareText(transaction, outletName)

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pesanan #${transaction.orderNumber}`,
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
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
        <Printer size={18} weight="fill" />
        Cetak Struk
      </Button>
      <Button variant="outline" className="flex-1 gap-2" onClick={() => void handleShare()}>
        {copied ? <Check size={18} weight="bold" /> : <ShareNetwork size={18} weight="fill" />}
        {copied ? 'Tersalin!' : 'Bagikan'}
      </Button>
    </div>
  )
}
