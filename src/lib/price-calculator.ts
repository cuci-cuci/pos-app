export interface PriceLineItem {
  quantity: number
  pricePerUnit: number
}

export interface PriceCalculationInput {
  items: PriceLineItem[]
  discountPercent: number
  taxRate: number
}

export interface PriceCalculationResult {
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
}

export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  const subtotal = input.items.reduce((sum, item) => {
    return sum + Math.round(item.quantity * item.pricePerUnit)
  }, 0)

  const discountAmount = Math.round(subtotal * (input.discountPercent / 100))
  const afterDiscount = subtotal - discountAmount
  const taxAmount = Math.round(afterDiscount * (input.taxRate / 100))
  const totalAmount = afterDiscount + taxAmount

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  }
}
