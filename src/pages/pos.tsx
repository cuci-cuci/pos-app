import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Service, ServiceCategory } from '@/db/schema'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { ServiceGrid } from '@/components/order/service-grid'
import { CartPanel } from '@/components/order/cart-panel'
import { CustomerSearch } from '@/components/customer/customer-search'
import { QuantityInput } from '@/components/order/quantity-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ShoppingCart } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

export function PosPage() {
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const getTotal = useCartStore((s) => s.getTotal)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [quantityService, setQuantityService] = useState<Service | null>(null)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

  const categories = useLiveQuery(
    () =>
      tenantId
        ? db.serviceCategories
            .where('tenantId')
            .equals(tenantId)
            .sortBy('sortOrder')
        : ([] as ServiceCategory[]),
    [tenantId]
  )

  const activeCategoryId = selectedCategoryId ?? categories?.[0]?.id ?? null

  const services = useLiveQuery(
    () => {
      if (!tenantId) return [] as Service[]
      if (activeCategoryId) {
        return db.services
          .where('[tenantId+categoryId]')
          .equals([tenantId, activeCategoryId])
          .toArray()
          .then((s: Service[]) => s.filter((sv: Service) => sv.isActive).sort((a: Service, b: Service) => a.sortOrder - b.sortOrder))
      }
      return db.services
        .where('tenantId')
        .equals(tenantId)
        .toArray()
        .then((s: Service[]) => s.filter((sv: Service) => sv.isActive).sort((a: Service, b: Service) => a.sortOrder - b.sortOrder))
    },
    [tenantId, activeCategoryId]
  )

  const handleSelectService = useCallback((service: Service) => {
    setQuantityService(service)
  }, [])

  const handleConfirmQuantity = useCallback(
    (quantity: number) => {
      if (!quantityService || !categories) return
      const cat = categories.find((c) => c.id === quantityService.categoryId)
      addItem({
        serviceId: quantityService.id,
        serviceName: quantityService.name,
        categoryName: cat?.name ?? '',
        unit: quantityService.unit,
        quantity,
        pricePerUnit: quantityService.pricePerUnit,
      })
    },
    [quantityService, categories, addItem]
  )

  const itemCount = cartItems.length
  const total = getTotal()

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Left: Services */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 pb-2">
          <CustomerSearch />
        </div>

        {/* Category tabs */}
        {categories && categories.length > 0 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  'min-h-[40px] touch-manipulation',
                  activeCategoryId === cat.id
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Service grid */}
        <div className="flex-1 overflow-y-auto">
          <ServiceGrid
            services={services ?? []}
            onSelectService={handleSelectService}
          />
        </div>
      </div>

      {/* Right: Cart (tablet+) */}
      <div className="hidden md:flex md:w-[360px] lg:w-[400px] border-l border-[var(--border)] bg-[var(--card)] flex-col">
        <CartPanel />
      </div>

      {/* Mobile: floating cart button */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartSheetOpen(true)}
          className={cn(
            'md:hidden fixed bottom-20 left-4 right-4 z-30',
            'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-2xl',
            'flex items-center justify-between px-5 py-4 shadow-lg',
            'active:scale-[0.98] transition-transform touch-manipulation'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={24} weight="fill" />
              <span className="absolute -top-2 -right-2 bg-white text-[var(--primary)] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <span className="font-semibold">Lihat Keranjang</span>
          </div>
          <span className="font-bold text-lg">{formatCurrency(total)}</span>
        </button>
      )}

      {/* Mobile cart sheet */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Keranjang</SheetTitle>
          </SheetHeader>
          <CartPanel />
        </SheetContent>
      </Sheet>

      {/* Quantity input dialog */}
      {quantityService && (
        <QuantityInput
          open={!!quantityService}
          onOpenChange={(open) => {
            if (!open) setQuantityService(null)
          }}
          serviceName={quantityService.name}
          unit={quantityService.unit}
          onConfirm={handleConfirmQuantity}
        />
      )}
    </div>
  )
}
