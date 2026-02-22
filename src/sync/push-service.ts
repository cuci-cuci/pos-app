import { db } from '@/db'
import type { Transaction } from '@/db/schema'
import { apiClient } from '@/services/api-client'
import { useDeviceStore } from '@/stores/device-store'
import { MAX_RETRY_ATTEMPTS } from '@/lib/constants'

export async function pushPendingTransactions(tenantId: string): Promise<number> {
  const pending = await db.transactions
    .where('[tenantId+syncStatus]')
    .equals([tenantId, 'pending'])
    .toArray()

  if (pending.length === 0) return 0

  const ids = pending.map((t: Transaction) => t.id)

  await db.transactions
    .where('id')
    .anyOf(ids)
    .modify({ syncStatus: 'syncing' })

  const deviceState = useDeviceStore.getState()
  const transactionsWithOutlet = pending.map((t: Transaction) => ({
    ...t,
    outlet_id: deviceState.outletId,
    member_id: t.memberId ?? null,
  }))

  try {
    await apiClient
      .post('pos/sync/upload', {
        json: { transactions: transactionsWithOutlet },
      })
      .json()

    const now = new Date().toISOString()
    await db.transactions
      .where('id')
      .anyOf(ids)
      .modify({ syncStatus: 'synced', syncedAt: now })

    await db.syncLogs.add({
      direction: 'push',
      entityType: 'transactions',
      recordCount: pending.length,
      success: true,
      timestamp: now,
    })

    return pending.length
  } catch (error) {
    for (const tx of pending) {
      const newRetry = tx.syncRetryCount + 1
      const newStatus = newRetry >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending'
      await db.transactions.update(tx.id, {
        syncStatus: newStatus as 'pending' | 'failed',
        syncRetryCount: newRetry,
      })
    }

    await db.syncLogs.add({
      direction: 'push',
      entityType: 'transactions',
      recordCount: pending.length,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    throw error
  }
}
