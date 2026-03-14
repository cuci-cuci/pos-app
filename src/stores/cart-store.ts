import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MemberTier } from '@/db/schema'

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

export interface MemberInfo {
  id: string
  name: string
  phone: string
  email?: string
  tier: MemberTier
  totalSpending: number
  totalPoints: number
  discountPercent: number
}

export type DeliveryType = 'pickup' | 'delivery'

export interface CartTab {
  id: string
  label: string
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  memberInfo: MemberInfo | null
  discountPercent: number
  pointsDiscount: number
  pointsUsed: number
  taxRate: number
  notes: string
  customerPhone: string
  estimatedDurationHours: number | null
  deliveryType: DeliveryType
  deliveryAddress: string
  deliveryFee: number
  scheduledPickupAt: string
}

const MAX_TABS = 3
let tabCounter = 1

function createEmptyTab(label?: string): CartTab {
  const num = tabCounter++
  return {
    id: crypto.randomUUID(),
    label: label ?? `Sesi ${num}`,
    items: [],
    customerId: null,
    customerName: null,
    memberInfo: null,
    discountPercent: 0,
    pointsDiscount: 0,
    pointsUsed: 0,
    taxRate: 0,
    notes: '',
    customerPhone: '',
    estimatedDurationHours: null,
    deliveryType: 'pickup',
    deliveryAddress: '',
    deliveryFee: 0,
    scheduledPickupAt: '',
  }
}

interface CartState {
  tabs: CartTab[]
  activeTabId: string

  // Tab management
  addTab: () => void
  removeTab: (id: string) => void
  switchTab: (id: string) => void

  // Active tab accessors (derived)
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  memberInfo: MemberInfo | null
  discountPercent: number
  pointsDiscount: number
  pointsUsed: number
  taxRate: number
  notes: string
  customerPhone: string
  estimatedDurationHours: number | null
  deliveryType: DeliveryType
  deliveryAddress: string
  deliveryFee: number
  scheduledPickupAt: string

  // Active tab mutations
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCustomer: (id: string | null, name: string | null) => void
  setMember: (member: MemberInfo | null) => void
  setDiscount: (percent: number) => void
  setPointsDiscount: (amount: number, pointsUsed: number) => void
  setTaxRate: (rate: number) => void
  setNotes: (notes: string) => void
  setCustomerPhone: (phone: string) => void
  setEstimatedDuration: (hours: number | null) => void
  setDeliveryType: (type: DeliveryType) => void
  setDeliveryAddress: (address: string) => void
  setDeliveryFee: (fee: number) => void
  setScheduledPickupAt: (dateTime: string) => void
  clear: () => void
  getSubtotal: () => number
  getTotal: () => number
}

function getActiveTab(tabs: CartTab[], activeTabId: string): CartTab {
  return tabs.find((t) => t.id === activeTabId) ?? tabs[0]
}

function updateActiveTab(
  tabs: CartTab[],
  activeTabId: string,
  updater: (tab: CartTab) => Partial<CartTab>,
): CartTab[] {
  return tabs.map((t) => (t.id === activeTabId ? { ...t, ...updater(t) } : t))
}

function deriveFromActiveTab(tabs: CartTab[], activeTabId: string) {
  const tab = getActiveTab(tabs, activeTabId)
  return {
    items: tab.items,
    customerId: tab.customerId,
    customerName: tab.customerName,
    memberInfo: tab.memberInfo,
    discountPercent: tab.discountPercent,
    pointsDiscount: tab.pointsDiscount,
    pointsUsed: tab.pointsUsed,
    taxRate: tab.taxRate,
    notes: tab.notes,
    customerPhone: tab.customerPhone,
    estimatedDurationHours: tab.estimatedDurationHours,
    deliveryType: tab.deliveryType,
    deliveryAddress: tab.deliveryAddress,
    deliveryFee: tab.deliveryFee,
    scheduledPickupAt: tab.scheduledPickupAt,
  }
}

const defaultTab = createEmptyTab('Sesi 1')

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tabs: [defaultTab],
      activeTabId: defaultTab.id,

      // Derived fields from active tab
      ...deriveFromActiveTab([defaultTab], defaultTab.id),

      // Tab management
      addTab: () => {
        const { tabs } = get()
        if (tabs.length >= MAX_TABS) return
        const newTab = createEmptyTab()
        const newTabs = [...tabs, newTab]
        set({
          tabs: newTabs,
          activeTabId: newTab.id,
          ...deriveFromActiveTab(newTabs, newTab.id),
        })
      },

      removeTab: (id) => {
        const { tabs, activeTabId } = get()
        if (tabs.length <= 1) return
        const idx = tabs.findIndex((t) => t.id === id)
        if (idx === -1) return
        const newTabs = tabs.filter((t) => t.id !== id)
        const newActiveId =
          activeTabId === id
            ? newTabs[Math.min(idx, newTabs.length - 1)].id
            : activeTabId
        set({
          tabs: newTabs,
          activeTabId: newActiveId,
          ...deriveFromActiveTab(newTabs, newActiveId),
        })
      },

      switchTab: (id) => {
        const { tabs } = get()
        if (!tabs.find((t) => t.id === id)) return
        set({
          activeTabId: id,
          ...deriveFromActiveTab(tabs, id),
        })
      },

      // Cart mutations — all operate on active tab
      addItem: (item) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, (tab) => {
          const existing = tab.items.find((i) => i.serviceId === item.serviceId)
          if (existing) {
            const newQty = existing.quantity + item.quantity
            return {
              items: tab.items.map((i) =>
                i.serviceId === item.serviceId
                  ? { ...i, quantity: newQty, subtotal: Math.round(newQty * i.pricePerUnit) }
                  : i,
              ),
            }
          }
          const id = crypto.randomUUID()
          const subtotal = Math.round(item.quantity * item.pricePerUnit)
          return { items: [...tab.items, { ...item, id, subtotal }] }
        })
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      removeItem: (id) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, (tab) => ({
          items: tab.items.filter((i) => i.id !== id),
        }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      updateQuantity: (id, quantity) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, (tab) => {
          if (quantity <= 0) {
            return { items: tab.items.filter((i) => i.id !== id) }
          }
          return {
            items: tab.items.map((i) =>
              i.id === id ? { ...i, quantity, subtotal: Math.round(quantity * i.pricePerUnit) } : i,
            ),
          }
        })
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setCustomer: (id, name) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({
          customerId: id,
          customerName: name,
          ...(name ? { label: name } : {}),
        }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setMember: (member) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => {
          if (member) {
            return {
              customerId: member.id,
              customerName: member.name,
              memberInfo: member,
              discountPercent: member.discountPercent,
              customerPhone: member.phone || '',
              label: member.name,
            }
          }
          return {
            customerId: null,
            customerName: null,
            memberInfo: null,
            discountPercent: 0,
            pointsDiscount: 0,
            pointsUsed: 0,
            customerPhone: '',
          }
        })
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setDiscount: (percent) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ discountPercent: percent }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setPointsDiscount: (amount, pointsUsed) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ pointsDiscount: amount, pointsUsed }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setTaxRate: (rate) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ taxRate: rate }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setNotes: (notes) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ notes }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setCustomerPhone: (phone) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ customerPhone: phone }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setEstimatedDuration: (hours) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({
          estimatedDurationHours: hours,
        }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setDeliveryType: (type) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({
          deliveryType: type,
          ...(type === 'pickup' ? { deliveryAddress: '', deliveryFee: 0 } : {}),
        }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setDeliveryAddress: (address) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ deliveryAddress: address }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setDeliveryFee: (fee) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ deliveryFee: fee }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      setScheduledPickupAt: (dateTime) => {
        const { tabs, activeTabId } = get()
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({ scheduledPickupAt: dateTime }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      clear: () => {
        const { tabs, activeTabId } = get()
        const tab = getActiveTab(tabs, activeTabId)
        // Keep the original tab label (e.g. "Tab 1") unless it was set to a customer name
        const originalLabel = tab.label.startsWith('Sesi ') ? tab.label : `Sesi ${tabs.indexOf(tab) + 1}`
        const newTabs = updateActiveTab(tabs, activeTabId, () => ({
          label: originalLabel,
          items: [],
          customerId: null,
          customerName: null,
          memberInfo: null,
          discountPercent: 0,
          pointsDiscount: 0,
          pointsUsed: 0,
          taxRate: 0,
          notes: '',
          customerPhone: '',
          estimatedDurationHours: null,
          deliveryType: 'pickup',
          deliveryAddress: '',
          deliveryFee: 0,
          scheduledPickupAt: '',
        }))
        set({ tabs: newTabs, ...deriveFromActiveTab(newTabs, activeTabId) })
      },

      getSubtotal: () => {
        const { tabs, activeTabId } = get()
        const tab = getActiveTab(tabs, activeTabId)
        return tab.items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getTotal: () => {
        const { tabs, activeTabId } = get()
        const tab = getActiveTab(tabs, activeTabId)
        const subtotal = tab.items.reduce((sum, item) => sum + item.subtotal, 0)
        const discount = Math.round(subtotal * (tab.discountPercent / 100))
        const afterDiscount = Math.max(0, subtotal - discount - tab.pointsDiscount)
        const tax = Math.round(afterDiscount * (tab.taxRate / 100))
        return afterDiscount + tax
      },
    }),
    {
      name: 'laundry-pos-cart',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const old = persisted as Record<string, unknown>
        if (version < 2) {
          // Migrate from single-cart format to multi-tab
          const tab: CartTab = {
            id: crypto.randomUUID(),
            label: (old.customerName as string) || 'Sesi 1',
            items: (old.items as CartItem[]) || [],
            customerId: (old.customerId as string | null) ?? null,
            customerName: (old.customerName as string | null) ?? null,
            memberInfo: (old.memberInfo as MemberInfo | null) ?? null,
            discountPercent: (old.discountPercent as number) ?? 0,
            pointsDiscount: 0,
            pointsUsed: 0,
            taxRate: (old.taxRate as number) ?? 0,
            notes: (old.notes as string) ?? '',
            customerPhone: (old.customerPhone as string) ?? '',
            estimatedDurationHours: (old.estimatedDurationHours as number | null) ?? null,
            deliveryType: 'pickup' as DeliveryType,
            deliveryAddress: '',
            deliveryFee: 0,
            scheduledPickupAt: '',
          }
          return {
            ...old,
            tabs: [tab],
            activeTabId: tab.id,
            ...deriveFromActiveTab([tab], tab.id),
          }
        }
        if (version < 3) {
          // Add pointsDiscount/pointsUsed to existing tabs
          const tabs = (old.tabs as CartTab[]) ?? []
          const updated = tabs.map((t) => ({
            ...t,
            pointsDiscount: t.pointsDiscount ?? 0,
            pointsUsed: t.pointsUsed ?? 0,
          }))
          return { ...old, tabs: updated }
        }
        return persisted
      },
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Set tabCounter higher than any existing tab number to avoid duplicates
          for (const tab of state.tabs) {
            const match = tab.label.match(/^Sesi (\d+)$/)
            if (match) {
              const num = Number.parseInt(match[1], 10)
              if (num >= tabCounter) tabCounter = num + 1
            }
          }
        }
      },
    },
  ),
)
