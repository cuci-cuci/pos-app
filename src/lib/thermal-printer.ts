/**
 * Thermal printer support via Web Serial API.
 * Generates ESC/POS commands for 80mm thermal printers.
 */

const ESC = 0x1b
const GS = 0x1d

// ESC/POS command helpers
const COMMANDS = {
  INIT: new Uint8Array([ESC, 0x40]),
  CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
  DOUBLE_HEIGHT: new Uint8Array([GS, 0x21, 0x01]),
  NORMAL_SIZE: new Uint8Array([GS, 0x21, 0x00]),
  CUT: new Uint8Array([GS, 0x56, 0x00]),
  FEED: new Uint8Array([ESC, 0x64, 0x04]),
}

const encoder = new TextEncoder()

function text(str: string): Uint8Array {
  return encoder.encode(str + '\n')
}

function line(char = '-', width = 32): Uint8Array {
  return text(char.repeat(width))
}

function leftRight(left: string, right: string, width = 32): Uint8Array {
  const spaces = Math.max(1, width - left.length - right.length)
  return text(left + ' '.repeat(spaces) + right)
}

export function isWebSerialSupported(): boolean {
  return 'serial' in navigator
}

interface ReceiptData {
  storeName: string
  orderNumber: string
  date: string
  time: string
  customerName?: string
  items: { name: string; qty: string; price: string; subtotal: string }[]
  subtotal: string
  discount?: string
  tax?: string
  total: string
  paymentMethod?: string
}

export function buildReceiptCommands(data: ReceiptData): Uint8Array {
  const parts: Uint8Array[] = []

  const push = (...cmds: Uint8Array[]) => {
    for (const c of cmds) parts.push(c)
  }

  // Initialize
  push(COMMANDS.INIT)

  // Header
  push(COMMANDS.CENTER, COMMANDS.BOLD_ON, COMMANDS.DOUBLE_HEIGHT)
  push(text(data.storeName))
  push(COMMANDS.NORMAL_SIZE, COMMANDS.BOLD_OFF)
  push(line('='))

  // Order info
  push(COMMANDS.LEFT)
  push(leftRight('No. Pesanan', `#${data.orderNumber}`))
  push(leftRight('Tanggal', data.date))
  push(leftRight('Waktu', data.time))
  if (data.customerName) {
    push(leftRight('Pelanggan', data.customerName))
  }
  push(line())

  // Items
  for (const item of data.items) {
    push(COMMANDS.BOLD_ON, text(item.name), COMMANDS.BOLD_OFF)
    push(leftRight(`  ${item.qty} x ${item.price}`, item.subtotal))
  }
  push(line())

  // Totals
  push(leftRight('Subtotal', data.subtotal))
  if (data.discount) {
    push(leftRight('Diskon', `-${data.discount}`))
  }
  if (data.tax) {
    push(leftRight('Pajak', data.tax))
  }
  push(COMMANDS.BOLD_ON)
  push(leftRight('TOTAL', data.total))
  push(COMMANDS.BOLD_OFF)

  // Payment
  if (data.paymentMethod) {
    push(line())
    push(leftRight('Pembayaran', data.paymentMethod.toUpperCase()))
  }

  // Footer
  push(line('='))
  push(COMMANDS.CENTER)
  push(text('Terima kasih!'))
  push(text(''))

  // Feed and cut
  push(COMMANDS.FEED, COMMANDS.CUT)

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serialPort: any = null

export async function connectPrinter(): Promise<boolean> {
  if (!isWebSerialSupported()) return false

  try {
    serialPort = await (navigator as any).serial.requestPort()
    await serialPort.open({ baudRate: 9600 })
    return true
  } catch {
    serialPort = null
    return false
  }
}

export async function printReceipt(data: ReceiptData): Promise<boolean> {
  if (!serialPort?.writable) {
    // Try to connect first
    const connected = await connectPrinter()
    if (!connected) return false
  }

  try {
    const commands = buildReceiptCommands(data)
    const writer = serialPort!.writable!.getWriter()
    await writer.write(commands)
    writer.releaseLock()
    return true
  } catch {
    return false
  }
}

export async function disconnectPrinter(): Promise<void> {
  if (serialPort) {
    try {
      await serialPort.close()
    } catch {
      // ignore
    }
    serialPort = null
  }
}
