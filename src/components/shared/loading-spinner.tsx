import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export function LoadingSpinner({ className, size = 32 }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <CircleNotch size={size} weight="bold" className="animate-spin text-primary" />
    </div>
  )
}
