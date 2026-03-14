import { apiClient } from './api-client'

export interface SupplyCategory {
  id: string
  name: string
  icon: string
  is_active: boolean
}

export interface Supply {
  id: string
  category_id?: string
  category_name?: string
  outlet_id?: string
  outlet_name?: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  cost_per_unit: number
  is_active: boolean
}

export interface StockMovement {
  id: string
  supply_id: string
  supply_name: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  notes?: string
  created_by_name: string
  created_at: string
}

export interface LowStockAlert {
  supply_id: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  outlet_name?: string
}

export interface ServiceSupplyMapping {
  id: string
  tenant_id: string
  service_template_id: string
  supply_id: string
  quantity_per_unit: number
  unit: string
  service_name: string
  supply_name: string
  created_at: string
}

export interface CreateMappingRequest {
  service_template_id: string
  supply_id: string
  quantity_per_unit: number
  unit: string
}

export interface UpdateMappingRequest {
  quantity_per_unit: number
  unit: string
}

export interface ServiceCost {
  service_template_id: string
  service_name: string
  total_cost_per_unit: number
  mapping_count: number
}

export const inventoryApi = {
  listCategories: () =>
    apiClient.get('owner/supply-categories').json<{ data: SupplyCategory[] }>(),
  createCategory: (data: { name: string; icon?: string }) =>
    apiClient.post('owner/supply-categories', { json: data }).json<{ data: SupplyCategory }>(),

  listSupplies: (params?: { category_id?: string; low_stock?: boolean }) =>
    apiClient.get('owner/supplies', { searchParams: params as Record<string, string> }).json<{ data: Supply[] }>(),
  createSupply: (data: Partial<Supply>) =>
    apiClient.post('owner/supplies', { json: data }).json<{ data: Supply }>(),
  updateSupply: (id: string, data: Partial<Supply>) =>
    apiClient.put(`owner/supplies/${id}`, { json: data }).json<any>(),

  recordMovement: (data: { supply_id: string; movement_type: string; quantity: number; notes?: string }) =>
    apiClient.post('owner/stock-movements', { json: data }).json<any>(),
  listMovements: (params?: { supply_id?: string; limit?: number }) =>
    apiClient.get('owner/stock-movements', { searchParams: params as Record<string, string> }).json<{ data: StockMovement[] }>(),

  getLowStockAlerts: () =>
    apiClient.get('owner/stock-alerts').json<{ data: LowStockAlert[] }>(),

  // Service-Supply Mappings
  listMappings: (serviceTemplateId?: string) =>
    apiClient
      .get('owner/service-supply-mappings', {
        searchParams: serviceTemplateId
          ? { service_template_id: serviceTemplateId }
          : undefined,
      })
      .json<{ data: ServiceSupplyMapping[] }>(),
  createMapping: (data: CreateMappingRequest) =>
    apiClient
      .post('owner/service-supply-mappings', { json: data })
      .json<{ data: ServiceSupplyMapping }>(),
  updateMapping: (id: string, data: UpdateMappingRequest) =>
    apiClient
      .put(`owner/service-supply-mappings/${id}`, { json: data })
      .json<any>(),
  deleteMapping: (id: string) =>
    apiClient.delete(`owner/service-supply-mappings/${id}`).json<any>(),

  // Service Costs
  getServiceCosts: () =>
    apiClient.get('owner/service-costs').json<{ data: ServiceCost[] }>(),
}
