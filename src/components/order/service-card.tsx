import type { Service } from '@/db/schema'
import { formatCurrency } from '@/lib/format'
import { getCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  categoryName: string
  cartQuantity?: number
  onSelect: (service: Service) => void
}

export function ServiceCard({ service, categoryName, cartQuantity, onSelect }: ServiceCardProps) {
  const IconComp = getCategoryIcon(categoryName)

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={cn(
        'relative flex flex-col p-4 rounded-xl shadow-sm border',
        'bg-card hover:bg-accent active:bg-accent',
        'min-h-[100px] transition-colors text-left no-select',
        'touch-manipulation'
      )}
    >
      {/* Cart badge */}
      {cartQuantity && cartQuantity > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
          x{cartQuantity}
        </span>
      )}

      {/* Category icon */}
      <IconComp size={18} className="text-muted-foreground mb-2" weight="duotone" />

      {/* Service name */}
      <span className="text-sm font-bold leading-tight line-clamp-2 mb-1">{service.name}</span>

      {/* Unit label */}
      <span className="text-xs text-muted-foreground mb-2">
        per {service.unit}
      </span>

      {/* Price */}
      <span className="text-primary font-semibold text-base mt-auto">
        {formatCurrency(service.pricePerUnit)}
      </span>
    </button>
  )
}
