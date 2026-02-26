import {
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
}

function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [open])

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDialogElement>) => {
      const dialog = dialogRef.current
      if (!dialog) return
      const rect = dialog.getBoundingClientRect()
      const isInDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (!isInDialog) {
        onOpenChange(false)
      }
    },
    [onOpenChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    },
    [onOpenChange],
  )

  return (
    <dialog
      ref={dialogRef}
      className={cn('m-auto backdrop:bg-black/50 bg-transparent p-0 max-w-lg w-[calc(100%-2rem)] open:animate-in open:fade-in-0 open:zoom-in-95', className)}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      onClose={() => onOpenChange(false)}
    >
      {children}
    </dialog>
  )
}

function DialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative">
      {/* Stacked layers behind the dialog */}
      <div className="absolute inset-x-3 -bottom-2 rounded-[var(--radius)] border bg-muted/60 h-full -z-10" />
      <div className="absolute inset-x-6 -bottom-4 rounded-[var(--radius)] border bg-muted/30 h-full -z-20" />
      <div
        className={cn('bg-card rounded-[var(--radius)] border shadow-lg p-6 relative', className)}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
}

function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
}

function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 gap-2',
        className,
      )}
      {...props}
    />
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
