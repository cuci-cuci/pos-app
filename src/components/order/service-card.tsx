import { AnimatePresence, motion } from 'framer-motion'
import type { Service } from '@/db/schema'
import { getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  categoryName: string
  cartQuantity?: number
  compact?: boolean
  onSelect: (service: Service) => void
}

function CartBadge({ quantity, size = 'md' }: { quantity: number; size?: 'sm' | 'md' }) {
  return (
    <AnimatePresence mode="popLayout">
      {quantity > 0 && (
        <motion.span
          key={quantity}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={cn(
            'absolute -top-2 -right-2 bg-primary text-primary-foreground font-bold rounded-full flex items-center justify-center z-10',
            size === 'sm' ? 'text-[10px] w-5 h-5' : 'text-[10px] w-6 h-6',
          )}
        >
          x{quantity}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function ServiceCard({
  service,
  categoryName,
  cartQuantity,
  compact,
  onSelect,
}: ServiceCardProps) {
  const IconComp = getCategoryIcon(categoryName)

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(service)}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative flex flex-col p-2.5 rounded-xl shadow-sm border',
          'bg-card hover:bg-accent active:bg-accent',
          'min-h-[72px] transition-colors text-left no-select',
          'touch-manipulation',
          cartQuantity && cartQuantity > 0 && 'border-primary/30',
        )}
      >
        <CartBadge quantity={cartQuantity ?? 0} size="sm" />
        <IconComp size={14} className="text-muted-foreground mb-1" />
        <span className="text-xs font-bold leading-tight line-clamp-2 mb-0.5">{service.name}</span>
        <span className="text-[10px] text-muted-foreground">per {service.unit}</span>
        <span className="text-primary font-semibold text-xs mt-auto">
          {formatCurrency(service.pricePerUnit)}
        </span>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(service)}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex flex-col p-4 rounded-xl shadow-sm border',
        'bg-card hover:bg-accent active:bg-accent',
        'min-h-[100px] transition-colors text-left no-select',
        'touch-manipulation',
        cartQuantity && cartQuantity > 0 && 'border-primary/30',
      )}
    >
      <CartBadge quantity={cartQuantity ?? 0} />

      {/* Category icon */}
      <IconComp size={18} className="text-muted-foreground mb-2" />

      {/* Service name */}
      <span className="text-sm font-bold leading-tight line-clamp-2 mb-1">{service.name}</span>

      {/* Unit label */}
      <span className="text-xs text-muted-foreground mb-2">per {service.unit}</span>

      {/* Price */}
      <span className="text-primary font-semibold text-base mt-auto">
        {formatCurrency(service.pricePerUnit)}
      </span>
    </motion.button>
  )
}
