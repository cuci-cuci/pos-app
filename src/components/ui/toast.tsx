import { useEffect } from 'react'
import { create } from 'zustand'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function showToast(message: string, type: ToastType = 'info') {
  const id = crypto.randomUUID()
  useToastStore.getState().addToast({ id, message, type })

  setTimeout(() => {
    useToastStore.getState().removeToast(id)
  }, 3000)
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius)] px-4 py-3 text-sm font-medium shadow-lg',
        toast.type === 'success' && 'bg-success text-primary-foreground',
        toast.type === 'error' && 'bg-destructive text-destructive-foreground',
        toast.type === 'info' && 'bg-foreground text-background'
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 rounded hover:opacity-80"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:w-80 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Auto-cleanup hook for component unmount edge cases
export function useToastCleanup() {
  useEffect(() => {
    return () => {
      // Cleanup is handled by timeouts
    }
  }, [])
}
