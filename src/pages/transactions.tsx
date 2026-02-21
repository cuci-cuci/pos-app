import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { TransactionList } from '@/components/transaction/transaction-list'
import { cn } from '@/lib/utils'

type FilterTab = 'today' | 'pending' | 'all'

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'pending', label: 'Belum Sinkron' },
  { id: 'all', label: 'Semua' },
]

export function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('today')
  const router = useRouter()

  const handleSelect = (id: string) => {
    void router.navigate({ to: '/transactions/$id', params: { id } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium rounded-[var(--radius)] transition-colors',
              'min-h-[44px] touch-manipulation',
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <TransactionList filter={activeTab} onSelect={handleSelect} />
      </div>
    </div>
  )
}
