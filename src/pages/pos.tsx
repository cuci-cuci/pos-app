import { ChartBar, Clock, CurrencyCircleDollar, Lightning, MagnifyingGlass, Plus, ShoppingCart, Warning, X } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartPanel } from '@/components/order/cart-panel'
import { QuantityInput } from '@/components/order/quantity-input'
import { ServiceCard } from '@/components/order/service-card'
import { EmptyState } from '@/components/shared/empty-state'
import { OpenShiftDialog } from '@/components/shift/open-shift-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { db } from '@/db'
import type { Service, ServiceCategory, Transaction } from '@/db/schema'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { useShiftStore } from '@/stores/shift-store'

export function PosPage() {
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const userRole = useAuthStore((s) => s.user?.role)
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const getTotal = useCartStore((s) => s.getTotal)
  const tabs = useCartStore((s) => s.tabs)
  const activeTabId = useCartStore((s) => s.activeTabId)
  const addTab = useCartStore((s) => s.addTab)
  const removeTab = useCartStore((s) => s.removeTab)
  const switchTab = useCartStore((s) => s.switchTab)
  const { currentShift, fetchCurrentShift, loading: shiftLoading } = useShiftStore()
  const [openShiftDialogOpen, setOpenShiftDialogOpen] = useState(false)

  useEffect(() => {
    fetchCurrentShift()
  }, [fetchCurrentShift])

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [quantityService, setQuantityService] = useState<Service | null>(null)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [closeTabConfirm, setCloseTabConfirm] = useState<string | null>(null)

  const handleTransactionComplete = useCallback((_tx: Transaction) => {
    setCartSheetOpen(false)
  }, [])

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId)
      if (tab && tab.items.length > 0) {
        setCloseTabConfirm(tabId)
      } else {
        removeTab(tabId)
      }
    },
    [tabs, removeTab],
  )

  const categories = useLiveQuery(
    () =>
      tenantId
        ? db.serviceCategories.where('tenantId').equals(tenantId).sortBy('sortOrder')
        : ([] as ServiceCategory[]),
    [tenantId],
  )

  const allServices = useLiveQuery(() => {
    if (!tenantId) return [] as Service[]
    return db.services
      .where('tenantId')
      .equals(tenantId)
      .toArray()
      .then((s: Service[]) =>
        s
          .filter((sv: Service) => sv.isActive)
          .sort((a: Service, b: Service) => a.sortOrder - b.sortOrder),
      )
  }, [tenantId])

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

  const quickAddServices = useMemo(() => {
    if (!allServices) return []
    return allServices.filter((s) => s.isQuickAdd)
  }, [allServices])

  const handleQuickAdd = useCallback(
    (service: Service) => {
      if (!categories) return
      const cat = categories.find((c) => c.id === service.categoryId)
      addItem({
        serviceId: service.id,
        serviceName: service.name,
        categoryName: cat?.name ?? '',
        unit: service.unit,
        quantity: 1,
        pricePerUnit: service.pricePerUnit,
      })
    },
    [categories, addItem],
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
    [quantityService, categories, addItem],
  )

  const itemCount = cartItems.length
  const total = getTotal()

  const router = useRouter()
  const isOwner = userRole === 'tenant_owner'

  if (!shiftLoading && !currentShift) {
    return (
      <div className="flex h-[calc(100vh-3.5rem-56px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Clock size={32} weight="fill" className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Buka Shift Terlebih Dahulu</h2>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? 'Buka shift untuk mulai transaksi, atau kelola toko dari dashboard.'
              : 'Anda harus membuka shift sebelum bisa melakukan transaksi.'}
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <Button onClick={() => setOpenShiftDialogOpen(true)}>Buka Shift</Button>
            {isOwner && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => router.navigate({ to: '/dashboard' })}
              >
                <ChartBar size={18} weight="fill" />
                Ke Dashboard
              </Button>
            )}
          </div>
        </div>
        <OpenShiftDialog open={openShiftDialogOpen} onOpenChange={setOpenShiftDialogOpen} />
      </div>
    )
  }

  const shiftOpenedTime = currentShift?.opened_at ? formatTime(currentShift.opened_at) : ''

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-56px)]">
      {/* Tab bar + shift info */}
      <div className="flex items-end gap-0 px-3 pt-2 bg-muted/30 border-b border-border">
        {/* Tabs */}
        <div className="flex items-end gap-0 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <LayoutGroup>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId
              const tabItemCount = tab.items.length
              return (
                <motion.button
                  key={tab.id}
                  layout
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors',
                    'min-w-[100px] max-w-[160px] touch-manipulation',
                    isActive
                      ? 'bg-card text-foreground border border-b-0 border-border z-10 -mb-px'
                      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                  {tabItemCount > 0 && (
                    <span
                      className={cn(
                        'shrink-0 text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/20 text-muted-foreground',
                      )}
                    >
                      {tabItemCount}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCloseTab(tab.id)
                      }}
                      className={cn(
                        'shrink-0 rounded-full p-0.5 transition-colors',
                        isActive
                          ? 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                          : 'hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive',
                      )}
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </motion.button>
              )
            })}
          </LayoutGroup>
          {tabs.length < 3 && (
            <button
              type="button"
              onClick={addTab}
              className="shrink-0 flex items-center justify-center w-8 h-8 mb-0.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
              aria-label="Tambah pelanggan"
            >
              <Plus size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Shift info — compact */}
        {currentShift && (
          <div className="hidden md:flex items-center gap-2 mb-1.5 ml-2 shrink-0">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={12} weight="fill" className="text-success" />
              {shiftOpenedTime}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CurrencyCircleDollar size={12} weight="fill" className="text-success" />
              {formatCurrency(currentShift.opening_cash)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Services */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search bar */}
          <div className="p-4 pb-2">
            <div className="relative">
              <MagnifyingGlass
                size={18}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Cari layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>

          {/* Quick-add strip */}
          {quickAddServices.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto scrollbar-hide border-b border-border">
              <Lightning size={14} weight="fill" className="text-amber-500 shrink-0" />
              {quickAddServices.map((svc) => (
                <button
                  type="button"
                  key={svc.id}
                  onClick={() => handleQuickAdd(svc)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                    'bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200',
                    'dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30',
                    'touch-manipulation',
                  )}
                >
                  {svc.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-1 min-h-0">
            {/* Category sidebar (desktop) */}
            {categories && categories.length > 0 && (
              <div className="hidden md:flex flex-col md:w-32 lg:w-40 xl:w-48 border-r border-border overflow-y-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    'flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium text-left transition-colors',
                    'min-h-[40px] border-l-2',
                    selectedCategoryId === null
                      ? 'bg-primary/10 text-primary border-l-primary'
                      : 'text-muted-foreground border-l-transparent hover:bg-accent',
                  )}
                >
                  Semua
                </button>
                {categories.map((cat) => {
                  const IconComp = getCategoryIcon(cat.name, cat.icon)
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm font-medium text-left transition-colors',
                        'min-h-[40px] border-l-2',
                        selectedCategoryId === cat.id
                          ? 'bg-primary/10 text-primary border-l-primary'
                          : 'text-muted-foreground border-l-transparent hover:bg-accent',
                      )}
                    >
                      <IconComp
                        size={16}
                        weight={selectedCategoryId === cat.id ? 'fill' : 'regular'}
                      />
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
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      'min-h-[36px] touch-manipulation',
                      selectedCategoryId === null
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    Semua
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                        'min-h-[36px] touch-manipulation',
                        selectedCategoryId === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Service grid */}
              <div className="flex-1 overflow-y-auto md:overflow-y-auto">
                {filteredServices.length === 0 ? (
                  <EmptyState
                    icon={<MagnifyingGlass size={48} weight="bold" />}
                    title="Tidak ada layanan"
                    description={
                      searchQuery ? 'Coba kata kunci lain' : 'Belum ada layanan untuk kategori ini.'
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2 lg:gap-3 p-3 md:p-3 lg:p-4">
                    {filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        categoryName={
                          categories?.find((c) => c.id === service.categoryId)?.name ?? ''
                        }
                        categoryIcon={categories?.find((c) => c.id === service.categoryId)?.icon}
                        cartQuantity={cartItems.find((ci) => ci.serviceId === service.id)?.quantity}
                        compact={true}
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
            <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} weight="fill" className="text-primary" />
                <span className="text-sm font-medium">{itemCount} item</span>
              </div>
              <span className="text-base font-bold">{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        {/* Right: Cart (tablet+) */}
        <div className="hidden md:flex md:w-[280px] lg:w-[340px] xl:w-[400px] border-l border-border bg-card flex-col">
          <CartPanel onTransactionComplete={handleTransactionComplete} />
        </div>

        {/* Mobile: floating cart bar */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              key="cart-bar"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed bottom-[72px] left-3 right-3 z-30"
            >
              <button
                type="button"
                onClick={() => setCartSheetOpen(true)}
                className={cn(
                  'w-full bg-primary text-primary-foreground rounded-2xl',
                  'flex items-center justify-between px-5 py-4',
                  'shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
                  'active:scale-[0.98] transition-transform touch-manipulation',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart size={22} weight="fill" />
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-2 -right-2.5 bg-white text-primary text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  </div>
                  <span className="font-semibold text-sm">Lihat Keranjang</span>
                </div>
                <span className="font-bold text-lg">{formatCurrency(total)}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile cart sheet */}
        <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>
            <CartPanel onTransactionComplete={handleTransactionComplete} />
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
            currentCartQuantity={
              cartItems.find((ci) => ci.serviceId === quantityService.id)?.quantity
            }
            onConfirm={handleConfirmQuantity}
          />
        )}

      </div>

      {/* Close tab confirmation dialog */}
      <Dialog open={!!closeTabConfirm} onOpenChange={(open) => !open && setCloseTabConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader className="flex-row items-start gap-3 text-left">
            <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Warning size={20} weight="fill" className="text-destructive" />
            </div>
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-left">Tutup tab ini?</DialogTitle>
              <DialogDescription className="text-left">
                Tab ini masih memiliki item di keranjang. Semua item akan dihapus jika tab ditutup.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCloseTabConfirm(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (closeTabConfirm) removeTab(closeTabConfirm)
                setCloseTabConfirm(null)
              }}
            >
              Tutup Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
