import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

export function generateId(): string {
  return uuidv4()
}

const COUNTER_KEY = 'pos_order_counter'
const DATE_KEY = 'pos_order_date'

export function generateOrderNumber(): string {
  const today = format(new Date(), 'yyyyMMdd')
  const storedDate = localStorage.getItem(DATE_KEY)

  let counter: number
  if (storedDate === today) {
    const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10)
    counter = current + 1
  } else {
    counter = 1
    localStorage.setItem(DATE_KEY, today)
  }

  localStorage.setItem(COUNTER_KEY, String(counter))
  const paddedCounter = String(counter).padStart(3, '0')
  return `POS-${today}-${paddedCounter}`
}
