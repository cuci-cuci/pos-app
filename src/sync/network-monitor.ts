import { useSyncStore } from '@/stores/sync-store'

type StatusChangeCallback = (online: boolean) => void

class NetworkMonitor {
  private callback: StatusChangeCallback | null = null
  private boundOnline: () => void
  private boundOffline: () => void
  private initialized = false

  constructor() {
    this.boundOnline = this.handleOnline.bind(this)
    this.boundOffline = this.handleOffline.bind(this)
  }

  private handleOnline() {
    useSyncStore.getState().setOnline(true)
    this.callback?.(true)
  }

  private handleOffline() {
    useSyncStore.getState().setOnline(false)
    this.callback?.(false)
  }

  start(callback?: StatusChangeCallback) {
    if (this.initialized) return
    this.initialized = true
    this.callback = callback ?? null

    useSyncStore.getState().setOnline(navigator.onLine)

    window.addEventListener('online', this.boundOnline)
    window.addEventListener('offline', this.boundOffline)
  }

  stop() {
    if (!this.initialized) return
    this.initialized = false
    window.removeEventListener('online', this.boundOnline)
    window.removeEventListener('offline', this.boundOffline)
    this.callback = null
  }
}

export const networkMonitor = new NetworkMonitor()
