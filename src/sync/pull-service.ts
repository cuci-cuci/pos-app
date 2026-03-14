import { db } from '@/db'
import type {
  Customer,
  DeliveryZone,
  Outlet,
  PaymentMethod,
  Service,
  ServiceCategory,
  TenantConfig,
} from '@/db/schema'
import { apiClient } from '@/services/api-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PullResponse {
  config_version: number
  config?: any
  categories?: any[]
  services?: any[]
  payment_methods?: any[]
  members?: any[]
  outlets?: any[]
  delivery_zones?: any[]
}

function mapOutlet(tenantId: string, o: any): Outlet {
  return {
    id: o.id,
    tenantId: o.tenant_id ?? tenantId,
    name: o.name,
    address: o.address ?? '',
    phone: o.phone ?? '',
    isActive: o.is_active ?? true,
  }
}

function mapCategory(tenantId: string, c: any): ServiceCategory {
  return {
    id: c.id,
    tenantId: c.tenant_id ?? tenantId,
    name: c.name,
    icon: c.icon ?? '',
    description: c.description ?? '',
    sortOrder: c.sort_order ?? 0,
    isActive: c.is_active ?? true,
    createdAt: c.created_at ?? '',
    updatedAt: c.updated_at ?? '',
  }
}

function mapService(tenantId: string, s: any): Service {
  return {
    id: s.id,
    tenantId: s.tenant_id ?? tenantId,
    categoryId: s.category_id ?? '',
    name: s.name,
    description: s.description ?? '',
    unit: s.pricing_unit ?? s.unit ?? '',
    pricePerUnit: s.tenant_price ?? s.base_price ?? 0,
    estimatedDuration: s.estimated_duration_hours ?? 0,
    isActive: s.is_active ?? true,
    isQuickAdd: s.is_quick_add ?? false,
    sortOrder: s.sort_order ?? 0,
    createdAt: s.created_at ?? '',
    updatedAt: s.updated_at ?? '',
  }
}

function mapPaymentMethod(tenantId: string, pm: any): PaymentMethod {
  return {
    id: pm.id,
    tenantId: pm.tenant_id ?? tenantId,
    name: pm.name,
    type: pm.type ?? 'other',
    isActive: pm.is_active ?? true,
    createdAt: pm.created_at ?? '',
    updatedAt: pm.updated_at ?? '',
  }
}

function mapMember(tenantId: string, m: any): Customer {
  return {
    id: m.id,
    tenantId: m.tenant_id ?? tenantId,
    name: m.name,
    phone: m.phone ?? '',
    email: m.email ?? '',
    address: m.address ?? '',
    tier: m.tier,
    totalSpending: m.total_spending ?? 0,
    discountPercent: m.discount_percent ?? 0,
    isMember: true,
    createdAt: m.created_at ?? '',
    updatedAt: m.updated_at ?? '',
  }
}

function mapConfig(tenantId: string, c: any): TenantConfig {
  return {
    id: c.id ?? 'main',
    tenantId: c.tenant_id ?? tenantId,
    tenantName: c.data?.storeName ?? '',
    address: c.data?.address ?? '',
    phone: c.data?.phone ?? '',
    taxRate: c.data?.taxRate ?? 0,
    currency: c.data?.currency ?? 'IDR',
    version: c.version ?? 1,
    updatedAt: c.created_at ?? '',
  }
}

function mapDeliveryZone(tenantId: string, dz: any): DeliveryZone {
  return {
    id: dz.id,
    tenantId: dz.tenant_id ?? tenantId,
    outletId: dz.outlet_id ?? '',
    name: dz.name,
    district: dz.district ?? undefined,
    fee: dz.fee ?? 0,
    estimatedMinutes: dz.estimated_minutes ?? 60,
    isActive: dz.is_active ?? true,
  }
}

export async function pullConfig(tenantId: string, currentVersion: number): Promise<number> {
  const raw = await apiClient
    .get('pos/sync/download', {
      searchParams: { current_config_version: currentVersion },
    })
    .json<{ data: PullResponse } | PullResponse>()

  const response: PullResponse =
    'data' in raw && raw.data && typeof raw.data === 'object' && 'config_version' in raw.data
      ? (raw.data as PullResponse)
      : (raw as PullResponse)

  if (response.config_version <= currentVersion) {
    return currentVersion
  }

  await db.transaction(
    'rw',
    [
      db.tenantConfig,
      db.serviceCategories,
      db.services,
      db.paymentMethods,
      db.customers,
      db.outlets,
    ],
    async () => {
      if (response.config) {
        await db.tenantConfig.clear()
        await db.tenantConfig.put(mapConfig(tenantId, response.config))
      }

      if (response.categories?.length) {
        await db.serviceCategories.clear()
        await db.serviceCategories.bulkPut(response.categories.map((c) => mapCategory(tenantId, c)))
      }

      if (response.services?.length) {
        await db.services.clear()
        await db.services.bulkPut(response.services.map((s) => mapService(tenantId, s)))
      }

      if (response.outlets?.length) {
        await db.outlets.clear()
        await db.outlets.bulkPut(response.outlets.map((o) => mapOutlet(tenantId, o)))
      }

      if (response.payment_methods?.length) {
        await db.paymentMethods.clear()
        await db.paymentMethods.bulkPut(
          response.payment_methods.map((pm) => mapPaymentMethod(tenantId, pm)),
        )
      }

      if (response.members?.length) {
        await db.customers.bulkPut(response.members.map((m) => mapMember(tenantId, m)))
      }
    },
  )

  await db.syncState.put({
    id: 'main',
    lastPullAt: new Date().toISOString(),
    lastConfigVersion: response.config_version,
  })

  await db.syncLogs.add({
    direction: 'pull',
    entityType: 'config',
    recordCount: 1,
    success: true,
    timestamp: new Date().toISOString(),
  })

  return response.config_version
}
