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

export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface MemberInfo {
  id: string
  name: string
  phone: string
  email?: string
  tier: MemberTier
  totalSpending: number
  discountPercent: number
}

interface CartState {
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  memberInfo: MemberInfo | null
  discountPercent: number
  taxRate: number
  notes: string
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCustomer: (id: string | null, name: string | null) => void
  setMember: (member: MemberInfo | null) => void
  setDiscount: (percent: number) => void
  setTaxRate: (rate: number) => void
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
      memberInfo: null,
      discountPercent: 0,
      taxRate: 0,
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

      setMember: (member) => {
        if (member) {
          set({
            customerId: member.id,
            customerName: member.name,
            memberInfo: member,
            discountPercent: member.discountPercent,
          })
        } else {
          set({
            customerId: null,
            customerName: null,
            memberInfo: null,
            discountPercent: 0,
          })
        }
      },

      setDiscount: (percent) => {
        set({ discountPercent: percent })
      },

      setTaxRate: (rate) => {
        set({ taxRate: rate })
      },

      setNotes: (notes) => {
        set({ notes })
      },

      clear: () => {
        set({
          items: [],
          customerId: null,
          customerName: null,
          memberInfo: null,
          discountPercent: 0,
          taxRate: 0,
          notes: '',
        })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getTotal: () => {
        const subtotal = get().items.reduce((sum, item) => sum + item.subtotal, 0)
        const discount = Math.round(subtotal * (get().discountPercent / 100))
        const afterDiscount = subtotal - discount
        const tax = Math.round(afterDiscount * (get().taxRate / 100))
        return afterDiscount + tax
      },
    }),
    {
      name: 'laundry-pos-cart',
    }
  )
)
