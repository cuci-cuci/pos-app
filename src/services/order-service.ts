import { db } from '@/db'
import type { Payment, Transaction, TransactionItem } from '@/db/schema'
import { generateId, generateOrderNumber } from '@/lib/id-generator'
import { calculatePrice } from '@/lib/price-calculator'
import { useAuthStore } from '@/stores/auth-store'
import { type CartItem, useCartStore } from '@/stores/cart-store'
import { useDeviceStore } from '@/stores/device-store'
import { useShiftStore } from '@/stores/shift-store'
import { useSyncStore } from '@/stores/sync-store'
import { syncEngine } from '@/sync/sync-engine'

interface PaymentInput {
  methodId: string
  methodName: string
  methodType: string
  cashTendered?: number
  gatewayExternalId?: string
  gatewayPaymentUrl?: string
  gatewayStatus?: string
  transactionId?: string
  paymentItemId?: string
}

/** Build a Transaction object from current cart state without saving or clearing. */
export async function buildTransaction(paymentInput: PaymentInput): Promise<Transaction> {
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

  const basePrice = calculatePrice({
    items: cart.items.map((item: CartItem) => ({
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
    })),
    discountPercent: cart.discountPercent,
    taxRate,
  })

  // Apply points discount (fixed amount) after percentage discount, before tax
  const pointsDiscount = cart.pointsDiscount ?? 0
  const afterPercentDiscount = basePrice.subtotal - basePrice.discountAmount
  const afterPointsDiscount = Math.max(0, afterPercentDiscount - pointsDiscount)
  const adjustedTax = Math.round(afterPointsDiscount * (taxRate / 100))
  const priceResult = pointsDiscount > 0
    ? { ...basePrice, discountAmount: basePrice.discountAmount + pointsDiscount, taxAmount: adjustedTax, totalAmount: afterPointsDiscount + adjustedTax }
    : basePrice

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
    id: paymentInput.paymentItemId ?? generateId(),
    methodId: paymentInput.methodId,
    methodName: paymentInput.methodName,
    methodType: paymentInput.methodType,
    amount: priceResult.totalAmount,
    cashTendered: paymentInput.cashTendered,
    changeAmount,
    gatewayExternalId: paymentInput.gatewayExternalId,
    gatewayPaymentUrl: paymentInput.gatewayPaymentUrl,
    gatewayStatus: paymentInput.gatewayStatus,
  }

  // Compute smart default duration from service estimated durations
  let estimatedHours = cart.estimatedDurationHours
  if (estimatedHours === null && cart.items.length > 0) {
    const serviceIds = cart.items.map((i: CartItem) => i.serviceId)
    const services = await db.services.where('id').anyOf(serviceIds).toArray()
    const maxDuration = Math.max(...services.map((s) => s.estimatedDuration ?? 0))
    if (maxDuration > 0) estimatedHours = maxDuration
  }

  const now = new Date().toISOString()

  return {
    id: paymentInput.transactionId ?? generateId(),
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
    customerPhone: cart.customerPhone || undefined,
    estimatedDurationHours: estimatedHours ?? undefined,
    deliveryType: cart.deliveryType !== 'pickup' ? cart.deliveryType : undefined,
    deliveryAddress: cart.deliveryAddress || undefined,
    deliveryFee: cart.deliveryFee || undefined,
    scheduledPickupAt: cart.scheduledPickupAt || undefined,
    status: 'completed',
    syncStatus: 'pending',
    syncRetryCount: 0,
    configVersion: sync.configVersion,
    createdAt: now,
    updatedAt: now,
  }
}

export async function createTransaction(paymentInput: PaymentInput): Promise<Transaction> {
  const transaction = await buildTransaction(paymentInput)

  await db.transactions.add(transaction)
  useCartStore.getState().clear()

  // Trigger immediate sync so transaction appears on server quickly
  void syncEngine.triggerSync()

  return transaction
}
