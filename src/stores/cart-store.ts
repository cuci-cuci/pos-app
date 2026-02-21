import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  serviceId: string
  serviceName: string
  categoryName: string
  unit: string
  quantity: number
  pricePerUnit: number
  subtotal: number
}

interface CartState {
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  discountPercent: number
  notes: string
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCustomer: (id: string | null, name: string | null) => void
  setDiscount: (percent: number) => void
  setNotes: (notes: string) => void
  clear: () => void
  getSubtotal: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      customerName: null,
      discountPercent: 0,
      notes: '',

      addItem: (item) => {
        const existing = get().items.find((i) => i.serviceId === item.serviceId)
        if (existing) {
          const newQty = existing.quantity + item.quantity
          set({
            items: get().items.map((i) =>
              i.serviceId === item.serviceId
                ? { ...i, quantity: newQty, subtotal: Math.round(newQty * i.pricePerUnit) }
                : i
            ),
          })
        } else {
          const id = crypto.randomUUID()
          const subtotal = Math.round(item.quantity * item.pricePerUnit)
          set({ items: [...get().items, { ...item, id, subtotal }] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id
              ? { ...i, quantity, subtotal: Math.round(quantity * i.pricePerUnit) }
              : i
          ),
        })
      },

      setCustomer: (id, name) => {
        set({ customerId: id, customerName: name })
      },

      setDiscount: (percent) => {
        set({ discountPercent: percent })
      },

      setNotes: (notes) => {
        set({ notes })
      },

      clear: () => {
        set({
          items: [],
          customerId: null,
          customerName: null,
          discountPercent: 0,
          notes: '',
        })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.subtotal, 0)
        const discount = Math.round(subtotal * (get().discountPercent / 100))
        return subtotal - discount
      },
    }),
    {
      name: 'laundry-pos-cart',
    }
  )
)
