import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <hr
      className={cn(
        'shrink-0 bg-border border-none',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
