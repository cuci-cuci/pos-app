import {
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

function useIsLandscapeTablet() {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 768 && window.innerWidth > window.innerHeight
  })

  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth >= 768 && window.innerWidth > window.innerHeight)
    }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isLandscape
}

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const isLandscape = useIsLandscapeTablet()

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
      if (e.target === dialogRef.current) {
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
      className={cn(
        'fixed inset-0 m-0 p-0 bg-transparent backdrop:bg-black/50 backdrop:animate-[fadeIn_0.2s_ease-out] max-w-full max-h-full w-full h-full',
        open && (isLandscape ? 'flex items-center justify-center' : 'flex items-end justify-center'),
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
  const [animating, setAnimating] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const isLandscape = useIsLandscapeTablet()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => setAnimating(false)
    el.addEventListener('animationend', handler)
    return () => el.removeEventListener('animationend', handler)
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'bg-card w-full max-h-[85vh] p-6 shadow-lg',
        isLandscape
          ? 'rounded-[var(--radius)] border max-w-lg'
          : 'rounded-t-[var(--radius)] border-t',
        animating ? 'overflow-hidden' : 'overflow-y-auto',
        className,
      )}
      style={{
        animation: `${isLandscape ? 'modalIn' : 'slideUp'} 0.3s cubic-bezier(0.32, 0.72, 0, 1)`,
      }}
      {...props}
    >
      {/* Drag handle — portrait/mobile only */}
      {!isLandscape && (
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
      )}
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
