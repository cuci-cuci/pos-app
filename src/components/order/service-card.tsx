import { AnimatePresence, motion } from 'framer-motion'
import type { Service } from '@/db/schema'
import { getCategoryColor, getCategoryIcon } from '@/lib/category-icons'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  categoryName: string
  categoryIcon?: string
  cartQuantity?: number
  compact?: boolean
  onSelect: (service: Service) => void
}

export function ServiceCard({
  service,
  categoryName,
  categoryIcon,
  cartQuantity,
  compact,
  onSelect,
}: ServiceCardProps) {
  const IconComp = getCategoryIcon(categoryName, categoryIcon)
  const iconColor = getCategoryColor(categoryName, categoryIcon)
  const isActive = cartQuantity != null && cartQuantity > 0

  if (compact) {
    return (
      <div className="relative">
        {/* Stacked bottom layer — sits behind card */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.2 }}
              style={{ originY: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-primary/70 rounded-b-xl px-2.5 pb-1.5 pt-3 z-0"
            >
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-semibold text-primary-foreground/80">
                  x{cartQuantity}
                </span>
                <span className="text-[10px] font-bold text-primary-foreground">
                  {formatCurrency(service.pricePerUnit * cartQuantity!)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => onSelect(service)}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'relative flex flex-col p-2.5 w-full rounded-xl',
            'min-h-[72px] transition-all text-left no-select',
            'touch-manipulation',
            isActive
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 mb-6 z-10'
              : 'bg-card border hover:bg-accent active:bg-accent',
          )}
        >
          <IconComp
            size={14}
            weight="fill"
            className={cn(isActive ? 'text-primary-foreground/70' : iconColor, 'mb-1')}
          />
          <span className="text-xs font-bold leading-tight line-clamp-2 mb-0.5">
            {service.name}
          </span>
          <span className={cn('text-[10px]', isActive ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
            per {service.unit}
          </span>
          <span className={cn('font-semibold text-xs mt-auto', isActive ? 'text-primary-foreground' : 'text-primary')}>
            {formatCurrency(service.pricePerUnit)}
          </span>
        </motion.button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Stacked bottom layer — sits behind card */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.2 }}
            style={{ originY: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-primary/70 rounded-b-xl px-4 pb-2 pt-4 z-0"
          >
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs font-semibold text-primary-foreground/80">
                x{cartQuantity}
              </span>
              <span className="text-sm font-bold text-primary-foreground">
                {formatCurrency(service.pricePerUnit * cartQuantity!)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => onSelect(service)}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative flex flex-col p-4 w-full rounded-xl',
          'min-h-[100px] transition-all text-left no-select',
          'touch-manipulation',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 mb-7 z-10'
            : 'bg-card border hover:bg-accent active:bg-accent',
        )}
      >
        {/* Category icon */}
        <IconComp
          size={18}
          weight="fill"
          className={cn(isActive ? 'text-primary-foreground/70' : iconColor, 'mb-2')}
        />

        {/* Service name */}
        <span className="text-sm font-bold leading-tight line-clamp-2 mb-1">
          {service.name}
        </span>

        {/* Unit label */}
        <span className={cn('text-xs mb-2', isActive ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
          per {service.unit}
        </span>

        {/* Price */}
        <span className={cn('font-semibold text-base mt-auto', isActive ? 'text-primary-foreground' : 'text-primary')}>
          {formatCurrency(service.pricePerUnit)}
        </span>
      </motion.button>
    </div>
  )
}
