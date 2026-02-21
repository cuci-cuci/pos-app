import type { Service } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { TShirt } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-[var(--radius)] border border-[var(--border)]',
        'bg-[var(--card)] hover:bg-[var(--accent)] active:bg-[var(--accent)]',
        'min-h-[100px] transition-colors text-center no-select',
        'touch-manipulation'
      )}
    >
      <TShirt size={28} className="text-[var(--primary)]" weight="duotone" />
      <span className="text-sm font-medium leading-tight line-clamp-2">{service.name}</span>
      <span className="text-xs text-[var(--muted-foreground)]">
        {formatCurrency(service.pricePerUnit)} / {service.unit}
      </span>
    </button>
  )
}
