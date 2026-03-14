import { describe, it, expect } from 'vitest'
import { calculatePrice } from '../price-calculator'

describe('calculatePrice', () => {
  it('calculates single item correctly', () => {
    const result = calculatePrice({
      items: [{ quantity: 3, pricePerUnit: 10000 }],
      discountPercent: 0,
      taxRate: 0,
    })
    expect(result.subtotal).toBe(30000)
    expect(result.discountAmount).toBe(0)
    expect(result.taxAmount).toBe(0)
    expect(result.totalAmount).toBe(30000)
  })

  it('calculates multiple items correctly', () => {
    const result = calculatePrice({
      items: [
        { quantity: 2, pricePerUnit: 15000 },
        { quantity: 1, pricePerUnit: 25000 },
      ],
      discountPercent: 0,
      taxRate: 0,
    })
    expect(result.subtotal).toBe(55000)
    expect(result.totalAmount).toBe(55000)
  })

  it('applies discount correctly', () => {
    const result = calculatePrice({
      items: [{ quantity: 1, pricePerUnit: 100000 }],
      discountPercent: 10,
      taxRate: 0,
    })
    expect(result.subtotal).toBe(100000)
    expect(result.discountAmount).toBe(10000)
    expect(result.totalAmount).toBe(90000)
  })

  it('applies tax after discount', () => {
    const result = calculatePrice({
      items: [{ quantity: 1, pricePerUnit: 100000 }],
      discountPercent: 10,
      taxRate: 11,
    })
    expect(result.subtotal).toBe(100000)
    expect(result.discountAmount).toBe(10000)
    // Tax on 90000: 90000 * 0.11 = 9900
    expect(result.taxAmount).toBe(9900)
    expect(result.totalAmount).toBe(99900)
  })

  it('handles zero quantity', () => {
    const result = calculatePrice({
      items: [{ quantity: 0, pricePerUnit: 10000 }],
      discountPercent: 0,
      taxRate: 0,
    })
    expect(result.subtotal).toBe(0)
    expect(result.totalAmount).toBe(0)
  })

  it('handles empty items array', () => {
    const result = calculatePrice({
      items: [],
      discountPercent: 0,
      taxRate: 0,
    })
    expect(result.subtotal).toBe(0)
    expect(result.totalAmount).toBe(0)
  })

  it('handles 100% discount', () => {
    const result = calculatePrice({
      items: [{ quantity: 1, pricePerUnit: 50000 }],
      discountPercent: 100,
      taxRate: 11,
    })
    expect(result.subtotal).toBe(50000)
    expect(result.discountAmount).toBe(50000)
    expect(result.taxAmount).toBe(0)
    expect(result.totalAmount).toBe(0)
  })

  it('rounds amounts correctly for fractional calculations', () => {
    const result = calculatePrice({
      items: [{ quantity: 3, pricePerUnit: 3333 }],
      discountPercent: 15,
      taxRate: 11,
    })
    // Subtotal: 3 * 3333 = 9999
    expect(result.subtotal).toBe(9999)
    // Discount: round(9999 * 0.15) = round(1499.85) = 1500
    expect(result.discountAmount).toBe(1500)
    // After discount: 9999 - 1500 = 8499
    // Tax: round(8499 * 0.11) = round(934.89) = 935
    expect(result.taxAmount).toBe(935)
    expect(result.totalAmount).toBe(8499 + 935)
  })

  it('handles large amounts', () => {
    const result = calculatePrice({
      items: [{ quantity: 100, pricePerUnit: 1000000 }],
      discountPercent: 5,
      taxRate: 11,
    })
    expect(result.subtotal).toBe(100000000)
    expect(result.discountAmount).toBe(5000000)
    const afterDiscount = 95000000
    expect(result.taxAmount).toBe(Math.round(afterDiscount * 0.11))
    expect(result.totalAmount).toBe(afterDiscount + Math.round(afterDiscount * 0.11))
  })
})
