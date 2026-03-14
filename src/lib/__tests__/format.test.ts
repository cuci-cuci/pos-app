import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrencyInput, sanitizeCurrencyInput } from '../format'

describe('formatCurrency', () => {
  it('formats positive amounts with Rp prefix', () => {
    expect(formatCurrency(10000)).toBe('Rp 10.000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
  })

  it('formats large amounts', () => {
    expect(formatCurrency(1500000)).toBe('Rp 1.500.000')
  })
})

describe('parseCurrencyInput', () => {
  it('parses normal digit string', () => {
    expect(parseCurrencyInput('200000')).toBe(200000)
  })

  it('strips non-digit characters', () => {
    expect(parseCurrencyInput('Rp 200.000')).toBe(200000)
  })

  it('handles empty string', () => {
    expect(parseCurrencyInput('')).toBe(0)
  })

  it('strips scientific notation characters', () => {
    // "2e8" → digits only → "28"
    expect(parseCurrencyInput('2e8')).toBe(28)
  })

  it('caps at default max (100M)', () => {
    expect(parseCurrencyInput('999999999')).toBe(100_000_000)
  })

  it('caps at custom max', () => {
    expect(parseCurrencyInput('50000', 10000)).toBe(10000)
  })

  it('handles string with only non-digits', () => {
    expect(parseCurrencyInput('abc')).toBe(0)
  })

  it('handles spaces and special chars', () => {
    expect(parseCurrencyInput('  1 0 0  ')).toBe(100)
  })
})

describe('sanitizeCurrencyInput', () => {
  it('keeps only digits', () => {
    expect(sanitizeCurrencyInput('Rp 200.000')).toBe('200000')
  })

  it('strips all non-digits', () => {
    expect(sanitizeCurrencyInput('abc123def456')).toBe('123456')
  })

  it('returns empty for no digits', () => {
    expect(sanitizeCurrencyInput('hello')).toBe('')
  })
})
