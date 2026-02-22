import { useRef, useEffect, useCallback, type ReactNode, type HTMLAttributes, type MouseEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
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
    [onOpenChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    },
    [onOpenChange]
  )

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 m-0 p-0 bg-transparent backdrop:bg-black/50 max-w-full max-h-full w-full h-full',
        open ? 'flex items-end justify-center' : ''
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      onClose={() => onOpenChange(false)}
    >
      {children}
    </dialog>
  )
}

function SheetContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[var(--card)] rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-lg border-t border-[var(--border)] animate-slide-up',
        className
      )}
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
      {...props}
    >
      <div className="mx-auto w-12 h-1.5 rounded-full bg-[var(--muted)] mb-4" />
      {children}
    </div>
  )
}

function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
}

function SheetTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

export { Sheet, SheetContent, SheetHeader, SheetTitle }
