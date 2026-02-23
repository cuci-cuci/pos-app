import { ArrowsClockwise, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface InlineErrorProps {
  message: string
  onRetry?: () => void
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="mb-3 flex items-center justify-center rounded-full w-12 h-12 bg-destructive/10">
        <WarningCircle size={24} weight="fill" className="text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground mb-3 max-w-[280px]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <ArrowsClockwise size={14} weight="bold" className="mr-1.5" />
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
