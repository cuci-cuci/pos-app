import { db } from '@/db'
import type { Transaction, TransactionItem, Payment } from '@/db/schema'
import { useCartStore, type CartItem } from '@/stores/cart-store'
import { useSyncStore } from '@/stores/sync-store'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { useShiftStore } from '@/stores/shift-store'
import { generateId, generateOrderNumber } from '@/lib/id-generator'
import { calculatePrice } from '@/lib/price-calculator'

interface PaymentInput {
  methodId: string
  methodName: string
  methodType: string
  cashTendered?: number
}

export async function createTransaction(paymentInput: PaymentInput): Promise<Transaction> {
  const cart = useCartStore.getState()
  const auth = useAuthStore.getState()
  const sync = useSyncStore.getState()

  if (!auth.user) {
    throw new Error('User not authenticated')
  }

  if (cart.items.length === 0) {
    throw new Error('Cart is empty')
  }

  const taxConfig = await db.tenantConfig.toCollection().first()
  const taxRate = taxConfig?.taxRate ?? 0

  const priceResult = calculatePrice({
    items: cart.items.map((item: CartItem) => ({
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
    })),
    discountPercent: cart.discountPercent,
    taxRate,
  })

  const transactionItems: TransactionItem[] = cart.items.map((item: CartItem) => ({
    id: generateId(),
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    categoryName: item.categoryName,
    unit: item.unit,
    quantity: item.quantity,
    pricePerUnit: item.pricePerUnit,
    subtotal: item.subtotal,
  }))

  const changeAmount =
    paymentInput.cashTendered !== undefined
      ? paymentInput.cashTendered - priceResult.totalAmount
      : undefined

  const payment: Payment = {
    id: generateId(),
    methodId: paymentInput.methodId,
    methodName: paymentInput.methodName,
    methodType: paymentInput.methodType,
    amount: priceResult.totalAmount,
    cashTendered: paymentInput.cashTendered,
    changeAmount,
  }

  const now = new Date().toISOString()

  const transaction: Transaction = {
    id: generateId(),
    tenantId: auth.user.tenantId,
    outletId: useDeviceStore.getState().outletId,
    orderNumber: generateOrderNumber(),
    customerId: cart.customerId ?? undefined,
    customerName: cart.customerName ?? undefined,
    memberId: cart.memberInfo?.id ?? undefined,
    items: transactionItems,
    payments: [payment],
    subtotal: priceResult.subtotal,
    discountPercent: cart.discountPercent,
    discountAmount: priceResult.discountAmount,
    taxRate,
    taxAmount: priceResult.taxAmount,
    totalAmount: priceResult.totalAmount,
    notes: cart.notes,
    shiftId: useShiftStore.getState().currentShift?.id,
    status: 'completed',
    syncStatus: 'pending',
    syncRetryCount: 0,
    configVersion: sync.configVersion,
    createdAt: now,
    updatedAt: now,
  }

  await db.transactions.add(transaction)
  cart.clear()

  return transaction
}
