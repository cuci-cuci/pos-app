import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateId, generateOrderNumber } from '../id-generator'

describe('generateId', () => {
  it('returns a valid UUID v4', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('generateOrderNumber', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('generates POS-YYYYMMDD-001 format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T10:00:00'))
    const num = generateOrderNumber()
    expect(num).toBe('POS-20260314-001')
    vi.useRealTimers()
  })

  it('increments counter within same day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T10:00:00'))
    expect(generateOrderNumber()).toBe('POS-20260314-001')
    expect(generateOrderNumber()).toBe('POS-20260314-002')
    expect(generateOrderNumber()).toBe('POS-20260314-003')
    vi.useRealTimers()
  })

  it('resets counter on new day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T10:00:00'))
    generateOrderNumber() // 001
    generateOrderNumber() // 002

    vi.setSystemTime(new Date('2026-03-15T08:00:00'))
    const num = generateOrderNumber()
    expect(num).toBe('POS-20260315-001')
    vi.useRealTimers()
  })

  it('pads counter to 3 digits', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00'))
    for (let i = 0; i < 99; i++) generateOrderNumber()
    const num = generateOrderNumber()
    expect(num).toBe('POS-20260101-100')
    vi.useRealTimers()
  })
})
