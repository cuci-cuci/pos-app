import { CheckCircle, Info, Warning, X, XCircle } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device-store'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'primary'
}

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  actions?: ToastAction[]
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts.slice(-4), toast], // max 5 visible
    })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// Sound effects using Web Audio API
const audioCtxRef: { current: AudioContext | null } = { current: null }

function getAudioContext(): AudioContext | null {
  if (!audioCtxRef.current) {
    try {
      audioCtxRef.current = new AudioContext()
    } catch {
      return null
    }
  }
  return audioCtxRef.current
}

function playSound(type: ToastType) {
  const soundEnabled = useDeviceStore.getState().soundEnabled
  if (!soundEnabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

  switch (type) {
    case 'success':
      osc.frequency.setValueAtTime(523, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1) // E5
      break
    case 'error':
      osc.frequency.setValueAtTime(330, ctx.currentTime) // E4
      osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15) // C4
      break
    case 'warning':
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1) // A4 repeat
      break
    case 'info':
      osc.frequency.setValueAtTime(587, ctx.currentTime) // D5
      break
  }

  osc.type = 'sine'
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

export function showToast(
  title: string,
  type: ToastType = 'info',
  options?: { description?: string; actions?: ToastAction[]; duration?: number },
) {
  const id = crypto.randomUUID()
  const duration = options?.duration ?? (options?.actions ? 8000 : 3500)

  useToastStore.getState().addToast({
    id,
    title,
    type,
    description: options?.description,
    actions: options?.actions,
    duration,
  })

  playSound(type)

  setTimeout(() => {
    useToastStore.getState().removeToast(id)
  }, duration)
}

const ICON_MAP = {
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive' },
  warning: { icon: Warning, color: 'text-warning', bg: 'bg-warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info' },
} as const

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleDismiss = () => {
    setExiting(true)
    timerRef.current = setTimeout(() => removeToast(toast.id), 200)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const { icon: IconComp, color } = ICON_MAP[toast.type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-card border rounded-xl px-4 py-3 shadow-lg w-full',
        'transition-all duration-200',
        exiting ? 'opacity-0 -translate-y-2 scale-95' : 'animate-[toastIn_0.25s_ease-out]',
      )}
    >
      <IconComp size={20} weight="fill" className={cn('shrink-0 mt-0.5', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      {toast.actions && toast.actions.length > 0 ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {toast.actions.map((action) => (
            <button
              type="button"
              key={action.label}
              onClick={() => {
                action.onClick()
                handleDismiss()
              }}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                action.variant === 'primary'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-accent',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
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
