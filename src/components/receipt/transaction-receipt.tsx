import type { Transaction } from '@/db/schema'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { useDeviceStore } from '@/stores/device-store'

interface TransactionReceiptProps {
  transaction: Transaction
}

export function TransactionReceipt({ transaction }: TransactionReceiptProps) {
  const outletName = useDeviceStore((s) => s.outletName)

  return (
    <div className="bg-white text-black p-4 font-mono text-xs leading-relaxed">
      <div className="text-center mb-3">
        <p className="text-sm font-bold">{outletName || 'kelarin'}</p>
        <p className="text-[10px] mt-0.5">================================</p>
      </div>

      <div className="mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>No. Pesanan</span>
          <span className="font-semibold">#{transaction.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal</span>
          <span>{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu</span>
          <span>{formatTime(transaction.createdAt)}</span>
        </div>
        {transaction.customerName && (
          <div className="flex justify-between">
            <span>Pelanggan</span>
            <span>{transaction.customerName}</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center">--------------------------------</p>

      <div className="my-2 space-y-1.5">
        {transaction.items.map((item) => (
          <div key={item.id}>
            <p className="font-medium">{item.serviceName}</p>
            <div className="flex justify-between pl-2">
              <span>
                {item.quantity} {item.unit} x {formatCurrency(item.pricePerUnit)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center">--------------------------------</p>

      <div className="my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {transaction.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Diskon ({transaction.discountPercent}%)</span>
            <span>-{formatCurrency(transaction.discountAmount)}</span>
          </div>
        )}
        {transaction.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>{formatCurrency(transaction.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
      </div>

      {transaction.payments[0] && (
        <>
          <p className="text-[10px] text-center">--------------------------------</p>
          <div className="my-2 space-y-0.5">
            <div className="flex justify-between">
              <span>Pembayaran</span>
              <span className="uppercase">{transaction.payments[0].methodName}</span>
            </div>
            {transaction.payments[0].cashTendered !== undefined && (
              <>
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>{formatCurrency(transaction.payments[0].cashTendered)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>{formatCurrency(transaction.payments[0].changeAmount ?? 0)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <p className="text-[10px] text-center">================================</p>
      <div className="text-center mt-2">
        <p className="font-semibold">Terima kasih!</p>
        <p className="text-[10px] mt-0.5 text-gray-500">Simpan struk ini sebagai bukti</p>
      </div>
    </div>
  )
}
