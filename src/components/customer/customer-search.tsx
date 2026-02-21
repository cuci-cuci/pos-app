import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Customer } from '@/db/schema'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { Input } from '@/components/ui/input'
import { UserCircle, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function CustomerSearch() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)

  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const { customerId, customerName, setCustomer } = useCartStore()

  const customers = useLiveQuery(
    () => {
      if (!tenantId || query.length < 2) return [] as Customer[]
      const q = query.toLowerCase()
      return db.customers
        .where('tenantId')
        .equals(tenantId)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q)
        )
        .limit(10)
        .toArray()
    },
    [tenantId, query]
  )

  const handleSelect = useCallback(
    (id: string, name: string) => {
      setCustomer(id, name)
      setQuery('')
      setShowResults(false)
    },
    [setCustomer]
  )

  const handleClear = useCallback(() => {
    setCustomer(null, null)
    setQuery('')
  }, [setCustomer])

  if (customerId) {
    return (
      <div className="flex items-center gap-2 bg-[var(--accent)] rounded-[var(--radius)] px-3 py-2">
        <UserCircle size={20} className="text-[var(--primary)]" weight="fill" />
        <span className="text-sm font-medium flex-1">{customerName}</span>
        <button
          onClick={handleClear}
          className="p-1 rounded hover:bg-[var(--background)]"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        placeholder="Cari pelanggan (nama/telepon)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowResults(true)
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="h-10"
      />

      {showResults && customers && customers.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg z-20 max-h-48 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelect(customer.id, customer.name)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                'hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors',
                'min-h-[44px]'
              )}
            >
              <UserCircle size={24} className="text-[var(--muted-foreground)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{customer.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{customer.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
