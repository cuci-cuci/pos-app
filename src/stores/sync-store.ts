import { create } from 'zustand'

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  pendingCount: number
  failedCount: number
  lastError: string | null
  configVersion: number
  hasConfigUpdate: boolean
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setLastSync: (date: string) => void
  setPendingCount: (count: number) => void
  setFailedCount: (count: number) => void
  setError: (error: string | null) => void
  setConfigVersions: (local: number, server: number) => void
}

export const useSyncStore = create<SyncState>()((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  failedCount: 0,
  lastError: null,
  configVersion: 0,
  hasConfigUpdate: false,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSync: (date) => set({ lastSyncAt: date }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setFailedCount: (count) => set({ failedCount: count }),
  setError: (error) => set({ lastError: error }),
  setConfigVersions: (local, server) =>
    set({
      configVersion: local,
      hasConfigUpdate: server > local,
    }),
}))
