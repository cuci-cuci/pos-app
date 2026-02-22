import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useDeviceStore } from '@/stores/device-store'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { orderApi } from '@/services/order-api'
import type { Order, OrderStatus } from '@/services/order-api'
import {
  Package,
  ArrowsClockwise,
} from '@phosphor-icons/react'

type FilterTab = 'all' | OrderStatus

interface TabItem {
  id: FilterTab
  label: string
}

const tabs: TabItem[] = [
  { id: 'all', label: 'Semua' },
  { id: 'received', label: 'Diterima' },
  { id: 'washing', label: 'Cuci' },
  { id: 'drying', label: 'Kering' },
  { id: 'ironing', label: 'Setrika' },
  { id: 'done', label: 'Selesai' },
  { id: 'picked_up', label: 'Diambil' },
]

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  received: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  washing: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  drying: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  ironing: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  done: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  picked_up: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

const statusLabels: Record<OrderStatus, string> = {
  received: 'Diterima',
  washing: 'Cuci',
  drying: 'Kering',
  ironing: 'Setrika',
  done: 'Selesai',
  picked_up: 'Diambil',
  cancelled: 'Batal',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = statusColors[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        colors.bg,
        colors.text
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export function OrdersPage() {
  const router = useRouter()
  const outletId = useDeviceStore((s) => s.outletId)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (outletId) {
        params.outlet_id = outletId
      }
      if (activeTab !== 'all') {
        params.status = activeTab
      }

      const response = await orderApi.list(params)
      setOrders(response.data)
    } catch {
      // silently handle error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [outletId, activeTab])

  useEffect(() => {
    setLoading(true)
    void fetchOrders()
  }, [fetchOrders])

  const handleRefresh = () => {
    setRefreshing(true)
    void fetchOrders()
  }

  const handleSelect = (id: string) => {
    void router.navigate({ to: '/orders/$id', params: { id } })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pesanan</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Kelola pesanan laundry
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors touch-manipulation"
        >
          <ArrowsClockwise
            size={22}
            className={cn(
              'text-[var(--muted-foreground)]',
              refreshing && 'animate-spin'
            )}
          />
        </button>
      </div>

      {/* Status filter tabs - horizontal scroll */}
      <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-full transition-colors',
                'min-h-[36px] touch-manipulation whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package size={48} />}
            title="Tidak ada pesanan"
            description="Belum ada pesanan untuk filter ini."
          />
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                type="button"
                key={order.id}
                onClick={() => handleSelect(order.id)}
                className="w-full text-left bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] p-3 active:bg-[var(--muted)] transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        #{order.order_number}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    {order.customer_name && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                        {order.customer_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatTime(order.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
