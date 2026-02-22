import { apiClient } from './api-client'

export interface OrderItem {
  id: string
  service_name: string
  quantity: number
  unit: string
  price: number
  subtotal: number
}

export interface OrderStatusLog {
  id: string
  status: string
  notes: string
  created_at: string
  created_by_name: string
}

export interface OrderTransaction {
  id: string
  order_number: string
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  payment_method: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
}

export interface OrderDetail extends Order {
  status_logs: OrderStatusLog[]
  transaction: OrderTransaction
}

export type OrderStatus =
  | 'received'
  | 'washing'
  | 'drying'
  | 'ironing'
  | 'done'
  | 'picked_up'
  | 'cancelled'

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface OrderListResponse {
  data: Order[]
  meta: PaginationMeta
}

export interface OrderDetailResponse {
  data: OrderDetail
}

export interface OrderResponse {
  data: Order
}

export interface ActiveOrdersResponse {
  data: Order[]
}

export const orderApi = {
  list: (params: Record<string, string>) =>
    apiClient
      .get('pos/orders', { searchParams: params })
      .json<OrderListResponse>(),

  listActive: (outletId?: string) =>
    apiClient
      .get('pos/orders/active', {
        searchParams: outletId ? { outlet_id: outletId } : {},
      })
      .json<ActiveOrdersResponse>(),

  getById: (id: string) =>
    apiClient.get(`pos/orders/${id}`).json<OrderDetailResponse>(),

  create: (data: Record<string, unknown>) =>
    apiClient.post('pos/orders', { json: data }).json<OrderResponse>(),

  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    apiClient
      .put(`pos/orders/${id}/status`, { json: data })
      .json<OrderResponse>(),
}
