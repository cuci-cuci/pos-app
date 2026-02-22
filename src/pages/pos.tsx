import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Service, ServiceCategory } from '@/db/schema'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { ServiceCard } from '@/components/order/service-card'
import { CartPanel } from '@/components/order/cart-panel'
import { QuantityInput } from '@/components/order/quantity-input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { ShoppingCart, MagnifyingGlass } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { getCategoryIcon } from '@/lib/category-icons'

export function PosPage() {
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const getTotal = useCartStore((s) => s.getTotal)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [quantityService, setQuantityService] = useState<Service | null>(null)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const allServices = useLiveQuery(
    () => {
      if (!tenantId) return [] as Service[]
      return db.services
        .where('tenantId')
        .equals(tenantId)
        .toArray()
        .then((s: Service[]) => s.filter((sv: Service) => sv.isActive).sort((a: Service, b: Service) => a.sortOrder - b.sortOrder))
    },
    [tenantId]
  )

  const filteredServices = useMemo(() => {
    if (!allServices) return []
    let result = allServices

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((s) => s.categoryId === selectedCategoryId)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q))
    }

    return result
  }, [allServices, selectedCategoryId, searchQuery])

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
        {/* Search bar */}
        <div className="p-4 pb-2">
          <div className="relative">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Cari layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Category sidebar (desktop) */}
          {categories && categories.length > 0 && (
            <div className="hidden md:flex flex-col w-48 border-r border-[var(--border)] overflow-y-auto shrink-0">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium text-left transition-colors',
                  'min-h-[44px] border-l-2',
                  selectedCategoryId === null
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-l-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] border-l-transparent hover:bg-[var(--accent)]'
                )}
              >
                Semua
              </button>
              {categories.map((cat) => {
                const IconComp = getCategoryIcon(cat.name)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium text-left transition-colors',
                      'min-h-[44px] border-l-2',
                      selectedCategoryId === cat.id
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-l-[var(--primary)]'
                        : 'text-[var(--muted-foreground)] border-l-transparent hover:bg-[var(--accent)]'
                    )}
                  >
                    <IconComp size={18} weight={selectedCategoryId === cat.id ? 'fill' : 'regular'} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Category pills (mobile) + Service grid */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile category pills */}
            {categories && categories.length > 0 && (
              <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide md:hidden">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    'min-h-[36px] touch-manipulation',
                    selectedCategoryId === null
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                  )}
                >
                  Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      'min-h-[36px] touch-manipulation',
                      selectedCategoryId === cat.id
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
              {filteredServices.length === 0 ? (
                <EmptyState
                  icon={<MagnifyingGlass size={48} />}
                  title="Tidak ada layanan"
                  description={searchQuery ? 'Coba kata kunci lain' : 'Belum ada layanan untuk kategori ini.'}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      categoryName={categories?.find((c) => c.id === service.categoryId)?.name ?? ''}
                      cartQuantity={cartItems.find((ci) => ci.serviceId === service.id)?.quantity}
                      onSelect={handleSelectService}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky cart bar (desktop) */}
        {itemCount > 0 && (
          <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-[var(--primary)]" weight="fill" />
              <span className="text-sm font-medium">{itemCount} item</span>
            </div>
            <span className="text-base font-bold">{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      {/* Right: Cart (tablet+) */}
      <div className="hidden md:flex md:w-[360px] lg:w-[400px] border-l border-[var(--border)] bg-[var(--card)] flex-col">
        <CartPanel />
      </div>

      {/* Mobile: floating cart bar */}
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
          pricePerUnit={quantityService.pricePerUnit}
          currentCartQuantity={cartItems.find((ci) => ci.serviceId === quantityService.id)?.quantity}
          onConfirm={handleConfirmQuantity}
        />
      )}
    </div>
  )
}
