import { db } from '@/db'
import type { ServiceCategory, Service, PaymentMethod, TenantConfig, Customer, Outlet } from '@/db/schema'
import { apiClient } from '@/services/api-client'

interface PullResponse {
  configVersion: number
  tenantConfig?: TenantConfig
  serviceCategories?: ServiceCategory[]
  services?: Service[]
  paymentMethods?: PaymentMethod[]
  customers?: Customer[]
  outlets?: Outlet[]
  payment_methods?: PaymentMethod[]
}

export async function pullConfig(
  tenantId: string,
  currentVersion: number
): Promise<number> {
  void tenantId

  const response = await apiClient
    .get('pos/sync/download', {
      searchParams: { current_config_version: currentVersion },
    })
    .json<PullResponse>()

  if (response.configVersion <= currentVersion) {
    return currentVersion
  }

  await db.transaction(
    'rw',
    [db.tenantConfig, db.serviceCategories, db.services, db.paymentMethods, db.customers, db.outlets],
    async () => {
      if (response.tenantConfig) {
        await db.tenantConfig.clear()
        await db.tenantConfig.put(response.tenantConfig)
      }

      if (response.serviceCategories) {
        await db.serviceCategories.clear()
        await db.serviceCategories.bulkPut(response.serviceCategories)
      }

      if (response.services) {
        await db.services.clear()
        await db.services.bulkPut(response.services)
      }

      if (response.outlets) {
        await db.outlets.clear()
        await db.outlets.bulkPut(response.outlets)
      }

      if (response.payment_methods) {
        await db.paymentMethods.clear()
        await db.paymentMethods.bulkPut(response.payment_methods)
      }

      if (response.paymentMethods) {
        await db.paymentMethods.clear()
        await db.paymentMethods.bulkPut(response.paymentMethods)
      }

      if (response.customers) {
        await db.customers.bulkPut(response.customers)
      }
    }
  )

  await db.syncState.put({
    id: 'main',
    lastPullAt: new Date().toISOString(),
    lastConfigVersion: response.configVersion,
  })

  await db.syncLogs.add({
    direction: 'pull',
    entityType: 'config',
    recordCount: 1,
    success: true,
    timestamp: new Date().toISOString(),
  })

  return response.configVersion
}
