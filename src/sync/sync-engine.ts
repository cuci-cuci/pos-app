import { networkMonitor } from './network-monitor'
import { pushPendingTransactions } from './push-service'
import { pullConfig } from './pull-service'
import { useSyncStore } from '@/stores/sync-store'
import { useAuthStore } from '@/stores/auth-store'
import { db } from '@/db'
import { SYNC_INTERVAL_MS } from '@/lib/constants'

class SyncEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private initialized = false

  async init() {
    if (this.initialized) return
    this.initialized = true

    networkMonitor.start((online) => {
      if (online) {
        void this.syncCycle()
      }
    })

    await this.loadLocalState()

    this.intervalId = setInterval(() => {
      void this.syncCycle()
    }, SYNC_INTERVAL_MS)

    void this.syncCycle()
  }

  private async loadLocalState() {
    const syncState = await db.syncState.get('main')
    const configVersion = syncState?.lastConfigVersion ?? 0

    const user = useAuthStore.getState().user
    if (user) {
      const pendingCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'pending'])
        .count()

      const failedCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'failed'])
        .count()

      useSyncStore.getState().setPendingCount(pendingCount)
      useSyncStore.getState().setFailedCount(failedCount)
      useSyncStore.getState().setConfigVersions(configVersion, configVersion)
    }
  }

  async syncCycle() {
    const syncStore = useSyncStore.getState()
    const user = useAuthStore.getState().user

    if (!syncStore.isOnline || syncStore.isSyncing || !user) return

    syncStore.setSyncing(true)
    syncStore.setError(null)

    try {
      await pushPendingTransactions(user.tenantId)

      const currentVersion = syncStore.configVersion
      const newVersion = await pullConfig(user.tenantId, currentVersion)

      syncStore.setConfigVersions(newVersion, newVersion)
      syncStore.setLastSync(new Date().toISOString())

      const pendingCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'pending'])
        .count()

      const failedCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'failed'])
        .count()

      syncStore.setPendingCount(pendingCount)
      syncStore.setFailedCount(failedCount)
    } catch (error) {
      syncStore.setError(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      syncStore.setSyncing(false)
    }
  }

  async triggerSync() {
    await this.syncCycle()
  }

  async forceSync() {
    const syncStore = useSyncStore.getState()
    const user = useAuthStore.getState().user
    if (!user) return

    syncStore.setSyncing(true)
    syncStore.setError(null)

    try {
      await pushPendingTransactions(user.tenantId)

      // Force pull by passing version 0 to bypass version check
      const newVersion = await pullConfig(user.tenantId, 0)

      syncStore.setConfigVersions(newVersion, newVersion)
      syncStore.setLastSync(new Date().toISOString())

      const pendingCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'pending'])
        .count()

      const failedCount = await db.transactions
        .where('[tenantId+syncStatus]')
        .equals([user.tenantId, 'failed'])
        .count()

      syncStore.setPendingCount(pendingCount)
      syncStore.setFailedCount(failedCount)
    } catch (error) {
      syncStore.setError(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      syncStore.setSyncing(false)
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    networkMonitor.stop()
    this.initialized = false
  }
}

export const syncEngine = new SyncEngine()
