import { apiClient } from './api-client'

export interface DeliveryZone {
  id: string
  tenant_id: string
  outlet_id: string
  name: string
  district?: string
  fee: number
  estimated_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateDeliveryZoneRequest {
  outlet_id: string
  name: string
  district?: string
  fee: number
  estimated_minutes: number
}

export interface UpdateDeliveryZoneRequest {
  name?: string
  district?: string
  fee?: number
  estimated_minutes?: number
  is_active?: boolean
}

export interface PickupRequest {
  id: string
  tenant_id: string
  outlet_id: string
  zone_id?: string
  order_id?: string
  customer_name: string
  customer_phone: string
  address: string
  pickup_type: 'pickup' | 'delivery'
  status: 'pending' | 'assigned' | 'in_transit' | 'completed' | 'cancelled'
  scheduled_at?: string
  completed_at?: string
  notes?: string
  delivery_fee: number
  created_at: string
  updated_at: string
  zone_name?: string
  outlet_name?: string
}

export interface CreatePickupRequestPayload {
  outlet_id: string
  zone_id?: string
  customer_name: string
  customer_phone: string
  address: string
  pickup_type: 'pickup' | 'delivery'
  scheduled_at?: string
  notes?: string
}

// Owner API (management)
export const deliveryApi = {
  // Zones
  listZones: (outletId?: string) => {
    const params: Record<string, string> = {}
    if (outletId) params.outlet_id = outletId
    return apiClient
      .get('owner/delivery-zones', { searchParams: params })
      .json<{ data: DeliveryZone[] }>()
  },

  createZone: (data: CreateDeliveryZoneRequest) =>
    apiClient.post('owner/delivery-zones', { json: data }).json<{ data: DeliveryZone }>(),

  updateZone: (id: string, data: UpdateDeliveryZoneRequest) =>
    apiClient.put(`owner/delivery-zones/${id}`, { json: data }).json<{ data: DeliveryZone }>(),

  deleteZone: (id: string) => apiClient.delete(`owner/delivery-zones/${id}`).json<unknown>(),

  // Pickup Requests
  listRequests: (params?: { outlet_id?: string; status?: string }) => {
    const searchParams: Record<string, string> = {}
    if (params?.outlet_id) searchParams.outlet_id = params.outlet_id
    if (params?.status) searchParams.status = params.status
    return apiClient
      .get('owner/pickup-requests', { searchParams })
      .json<{ data: PickupRequest[] }>()
  },

  createRequest: (data: CreatePickupRequestPayload) =>
    apiClient.post('owner/pickup-requests', { json: data }).json<{ data: PickupRequest }>(),

  updateRequestStatus: (id: string, status: string) =>
    apiClient
      .put(`owner/pickup-requests/${id}/status`, { json: { status } })
      .json<{ data: { status: string } }>(),
}

// POS API (for cashiers)
export const posDeliveryApi = {
  listZones: (outletId?: string) => {
    const params: Record<string, string> = {}
    if (outletId) params.outlet_id = outletId
    return apiClient
      .get('pos/delivery/zones', { searchParams: params })
      .json<{ data: DeliveryZone[] }>()
  },

  createRequest: (data: CreatePickupRequestPayload) =>
    apiClient.post('pos/delivery/requests', { json: data }).json<{ data: PickupRequest }>(),
}
