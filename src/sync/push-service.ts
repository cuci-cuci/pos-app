import { db } from '@/db'
import type { Transaction } from '@/db/schema'
import { MAX_RETRY_ATTEMPTS } from '@/lib/constants'
import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'

function mapTransactionToPayload(t: Transaction, outletId: string, userId: string) {
  return {
    id: t.id,
    outlet_id: outletId,
    local_order_number: t.orderNumber,
    customer_name: t.customerName ?? null,
    member_id: t.memberId ?? null,
    items: t.items,
    subtotal: t.subtotal,
    discount_amount: t.discountAmount,
    tax_amount: t.taxAmount,
    total_amount: t.totalAmount,
    payment_status: 'paid',
    payments: t.payments,
    status: t.status,
    config_version_id: '00000000-0000-0000-0000-000000000000',
    notes: t.notes || null,
    created_by: userId,
    created_at: t.createdAt,
    shift_id: t.shiftId ?? null,
    customer_phone: t.customerPhone ?? null,
    estimated_duration_hours: t.estimatedDurationHours ?? null,
    delivery_type: t.deliveryType ?? null,
    delivery_address: t.deliveryAddress ?? null,
    delivery_fee: t.deliveryFee ?? null,
    scheduled_pickup_at: t.scheduledPickupAt ?? null,
  }
}

/** Push a single transaction to backend immediately (used before gateway payment). */
export async function pushSingleTransaction(tx: Transaction): Promise<void> {
  // Idempotency: skip if already synced
  const existing = await db.transactions.get(tx.id)
  if (existing?.syncStatus === 'synced') return

  const deviceState = useDeviceStore.getState()
  const authUser = useAuthStore.getState().user
  const payload = mapTransactionToPayload(
    tx,
    deviceState.outletId,
    authUser?.id ?? '00000000-0000-0000-0000-000000000000',
  )

  await apiClient
    .post('pos/sync/upload', {
      json: { transactions: [payload] },
    })
    .json()

  await db.transactions.update(tx.id, {
    syncStatus: 'synced',
    syncedAt: new Date().toISOString(),
  })
}

export async function pushPendingTransactions(tenantId: string): Promise<number> {
  const pending = await db.transactions
    .where('[tenantId+syncStatus]')
    .equals([tenantId, 'pending'])
    .toArray()

  if (pending.length === 0) return 0

  const ids = pending.map((t: Transaction) => t.id)

  await db.transactions.where('id').anyOf(ids).modify({ syncStatus: 'syncing' })

  const deviceState = useDeviceStore.getState()
  const authUser = useAuthStore.getState().user
  const userId = authUser?.id ?? '00000000-0000-0000-0000-000000000000'
  const transactionsWithOutlet = pending.map((t: Transaction) =>
    mapTransactionToPayload(t, deviceState.outletId, userId),
  )

  try {
    await apiClient
      .post('pos/sync/upload', {
        json: { transactions: transactionsWithOutlet },
      })
      .json()

    const now = new Date().toISOString()
    await db.transactions.where('id').anyOf(ids).modify({ syncStatus: 'synced', syncedAt: now })

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
