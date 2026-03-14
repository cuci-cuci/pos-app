import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useCartStore, type MemberInfo } from '../cart-store'

function resetStore() {
  // Clear persisted state and reset store
  localStorage.clear()
  useCartStore.setState(useCartStore.getInitialState(), true)
}

const sampleItem = {
  serviceId: 'svc-1',
  serviceName: 'Cuci Kering',
  categoryName: 'Laundry',
  unit: 'kg',
  quantity: 3,
  pricePerUnit: 7000,
}

const sampleItem2 = {
  serviceId: 'svc-2',
  serviceName: 'Setrika',
  categoryName: 'Laundry',
  unit: 'kg',
  quantity: 2,
  pricePerUnit: 5000,
}

const sampleMember: MemberInfo = {
  id: 'member-1',
  name: 'Budi',
  phone: '08123456789',
  tier: 'gold',
  totalSpending: 3000000,
  totalPoints: 500,
  discountPercent: 10,
}

describe('cart-store', () => {
  beforeEach(() => resetStore())
  afterEach(() => resetStore())

  describe('addItem', () => {
    it('adds a new item to cart', () => {
      useCartStore.getState().addItem(sampleItem)
      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0].serviceId).toBe('svc-1')
      expect(items[0].quantity).toBe(3)
      expect(items[0].subtotal).toBe(21000) // 3 * 7000
    })

    it('merges quantity when adding same service', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, quantity: 2 })
      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(5) // 3 + 2
      expect(items[0].subtotal).toBe(35000) // 5 * 7000
    })

    it('adds different services as separate items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem(sampleItem2)
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('removes item by id', () => {
      useCartStore.getState().addItem(sampleItem)
      const itemId = useCartStore.getState().items[0].id
      useCartStore.getState().removeItem(itemId)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('does nothing for non-existent id', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().removeItem('non-existent')
      expect(useCartStore.getState().items).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('updates quantity and recalculates subtotal', () => {
      useCartStore.getState().addItem(sampleItem)
      const itemId = useCartStore.getState().items[0].id
      useCartStore.getState().updateQuantity(itemId, 5)
      const item = useCartStore.getState().items[0]
      expect(item.quantity).toBe(5)
      expect(item.subtotal).toBe(35000) // 5 * 7000
    })

    it('removes item when quantity set to 0', () => {
      useCartStore.getState().addItem(sampleItem)
      const itemId = useCartStore.getState().items[0].id
      useCartStore.getState().updateQuantity(itemId, 0)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      useCartStore.getState().addItem(sampleItem)
      const itemId = useCartStore.getState().items[0].id
      useCartStore.getState().updateQuantity(itemId, -1)
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('getSubtotal / getTotal', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getSubtotal()).toBe(0)
      expect(useCartStore.getState().getTotal()).toBe(0)
    })

    it('calculates subtotal correctly', () => {
      useCartStore.getState().addItem(sampleItem)  // 21000
      useCartStore.getState().addItem(sampleItem2) // 10000
      expect(useCartStore.getState().getSubtotal()).toBe(31000)
    })

    it('applies percentage discount', () => {
      useCartStore.getState().addItem(sampleItem) // 21000
      useCartStore.getState().setDiscount(10) // 10% off
      // discount = round(21000 * 0.10) = 2100
      // total = 21000 - 2100 = 18900
      expect(useCartStore.getState().getTotal()).toBe(18900)
    })

    it('applies tax after discount', () => {
      useCartStore.getState().addItem(sampleItem) // 21000
      useCartStore.getState().setDiscount(10) // 10% off
      useCartStore.getState().setTaxRate(11) // 11% PPN
      // subtotal = 21000
      // discount = round(21000 * 0.10) = 2100
      // afterDiscount = 18900
      // tax = round(18900 * 0.11) = 2079
      // total = 18900 + 2079 = 20979
      expect(useCartStore.getState().getTotal()).toBe(20979)
    })
  })

  describe('setMember', () => {
    it('sets member info and auto-applies discount', () => {
      useCartStore.getState().setMember(sampleMember)
      const state = useCartStore.getState()
      expect(state.memberInfo?.name).toBe('Budi')
      expect(state.customerId).toBe('member-1')
      expect(state.discountPercent).toBe(10)
      expect(state.customerPhone).toBe('08123456789')
    })

    it('clears member info when set to null', () => {
      useCartStore.getState().setMember(sampleMember)
      useCartStore.getState().setMember(null)
      const state = useCartStore.getState()
      expect(state.memberInfo).toBeNull()
      expect(state.customerId).toBeNull()
      expect(state.discountPercent).toBe(0)
    })
  })

  describe('tabs', () => {
    it('starts with one tab', () => {
      expect(useCartStore.getState().tabs).toHaveLength(1)
    })

    it('can add up to MAX_TABS (3)', () => {
      useCartStore.getState().addTab()
      useCartStore.getState().addTab()
      expect(useCartStore.getState().tabs).toHaveLength(3)
      // Adding beyond limit does nothing
      useCartStore.getState().addTab()
      expect(useCartStore.getState().tabs).toHaveLength(3)
    })

    it('switches to new tab on add', () => {
      const initialTabId = useCartStore.getState().activeTabId
      useCartStore.getState().addTab()
      expect(useCartStore.getState().activeTabId).not.toBe(initialTabId)
    })

    it('isolates items between tabs', () => {
      useCartStore.getState().addItem(sampleItem)
      expect(useCartStore.getState().items).toHaveLength(1)

      useCartStore.getState().addTab()
      expect(useCartStore.getState().items).toHaveLength(0)

      useCartStore.getState().addItem(sampleItem2)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].serviceName).toBe('Setrika')
    })

    it('switches back preserves items', () => {
      useCartStore.getState().addItem(sampleItem)
      const tab1Id = useCartStore.getState().activeTabId

      useCartStore.getState().addTab()
      useCartStore.getState().addItem(sampleItem2)

      useCartStore.getState().switchTab(tab1Id)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].serviceName).toBe('Cuci Kering')
    })

    it('removes tab and switches to adjacent', () => {
      const tab1Id = useCartStore.getState().activeTabId
      useCartStore.getState().addTab()
      const tab2Id = useCartStore.getState().activeTabId

      useCartStore.getState().removeTab(tab2Id)
      expect(useCartStore.getState().tabs).toHaveLength(1)
      expect(useCartStore.getState().activeTabId).toBe(tab1Id)
    })

    it('cannot remove last tab', () => {
      const tabId = useCartStore.getState().activeTabId
      useCartStore.getState().removeTab(tabId)
      expect(useCartStore.getState().tabs).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('resets active tab to empty state', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().setMember(sampleMember)
      useCartStore.getState().setNotes('test note')
      useCartStore.getState().setDeliveryType('delivery')
      useCartStore.getState().setDeliveryFee(5000)

      useCartStore.getState().clear()
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.memberInfo).toBeNull()
      expect(state.discountPercent).toBe(0)
      expect(state.notes).toBe('')
      expect(state.deliveryType).toBe('pickup')
      expect(state.deliveryFee).toBe(0)
    })

    it('does not affect other tabs', () => {
      useCartStore.getState().addItem(sampleItem)
      const tab1Id = useCartStore.getState().activeTabId

      useCartStore.getState().addTab()
      useCartStore.getState().addItem(sampleItem2)
      useCartStore.getState().clear()

      useCartStore.getState().switchTab(tab1Id)
      expect(useCartStore.getState().items).toHaveLength(1)
    })
  })

  describe('delivery', () => {
    it('sets delivery type and address', () => {
      useCartStore.getState().setDeliveryType('delivery')
      useCartStore.getState().setDeliveryAddress('Jl. Merdeka 123')
      useCartStore.getState().setDeliveryFee(10000)
      const state = useCartStore.getState()
      expect(state.deliveryType).toBe('delivery')
      expect(state.deliveryAddress).toBe('Jl. Merdeka 123')
      expect(state.deliveryFee).toBe(10000)
    })

    it('clears delivery fields when switching back to pickup', () => {
      useCartStore.getState().setDeliveryType('delivery')
      useCartStore.getState().setDeliveryAddress('Jl. Merdeka 123')
      useCartStore.getState().setDeliveryFee(10000)
      useCartStore.getState().setDeliveryType('pickup')
      const state = useCartStore.getState()
      expect(state.deliveryAddress).toBe('')
      expect(state.deliveryFee).toBe(0)
    })
  })
})
