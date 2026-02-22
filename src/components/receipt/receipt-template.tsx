import { useDeviceStore } from '@/stores/device-store'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import type { OrderDetail } from '@/services/order-api'

interface ReceiptTemplateProps {
  order: OrderDetail
}

export function ReceiptTemplate({ order }: ReceiptTemplateProps) {
  const outletName = useDeviceStore((s) => s.outletName)
  const tx = order.transaction

  if (!tx) return null

  return (
    <div className="receipt-printable bg-white text-black p-4 font-mono text-xs leading-relaxed">
      {/* Header */}
      <div className="text-center mb-3">
        <p className="text-sm font-bold">{outletName || 'LaundryPOS'}</p>
        <p className="text-[10px] mt-0.5">================================</p>
      </div>

      {/* Order info */}
      <div className="mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>No. Pesanan</span>
          <span className="font-semibold">#{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu</span>
          <span>{formatTime(order.created_at)}</span>
        </div>
        {order.customer_name && (
          <div className="flex justify-between">
            <span>Pelanggan</span>
            <span>{order.customer_name}</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center">--------------------------------</p>

      {/* Items */}
      <div className="my-2 space-y-1.5">
        {tx.items.map((item) => (
          <div key={item.id}>
            <p className="font-medium">{item.service_name}</p>
            <div className="flex justify-between pl-2">
              <span>
                {item.quantity} {item.unit} x {formatCurrency(item.price)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center">--------------------------------</p>

      {/* Totals */}
      <div className="my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(tx.subtotal)}</span>
        </div>
        {tx.discount > 0 && (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>-{formatCurrency(tx.discount)}</span>
          </div>
        )}
        {tx.tax > 0 && (
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>{formatCurrency(tx.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(tx.total_amount)}</span>
        </div>
      </div>

      {/* Payment method */}
      {tx.payment_method && (
        <>
          <p className="text-[10px] text-center">--------------------------------</p>
          <div className="flex justify-between my-2">
            <span>Pembayaran</span>
            <span className="uppercase">{tx.payment_method}</span>
          </div>
        </>
      )}

      {/* Footer */}
      <p className="text-[10px] text-center">================================</p>
      <div className="text-center mt-2">
        <p className="font-semibold">Terima kasih!</p>
        <p className="text-[10px] mt-0.5 text-gray-500">
          Simpan struk ini sebagai bukti
        </p>
      </div>
    </div>
  )
}
