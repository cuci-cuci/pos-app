import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/** Parse user input for IDR currency. Returns integer >= 0, capped at max. */
export function parseCurrencyInput(value: string, max = 100_000_000): number {
  const digits = value.replace(/[^0-9]/g, '')
  if (digits === '') return 0
  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.min(parsed, max)
}

/** Sanitize a raw input string to digits only. */
export function sanitizeCurrencyInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: id })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}
