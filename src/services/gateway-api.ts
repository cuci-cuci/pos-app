import { apiClient } from './api-client'

export type GatewayType = 'qris' | 'virtual_account' | 'ewallet'
export type GatewayStatus = 'PENDING' | 'ACTIVE' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED'

export interface GatewayPaymentResponse {
  id: string
  external_id: string
  gateway_status: GatewayStatus
  gateway_type: GatewayType
  amount: number
  gateway_payment_url?: string
  expires_at?: string
  created_at: string
}

export interface GatewayPaymentStatusResponse {
  external_id: string
  gateway_status: GatewayStatus
  paid_at?: string
  is_final: boolean
}

export async function createGatewayPayment(req: {
  transaction_id: string
  payment_item_id: string
  gateway_type: GatewayType
  amount: number
}) {
  const res = await apiClient
    .post('pos/gateway/payments', { json: req })
    .json<{ data: GatewayPaymentResponse }>()
  return res.data
}

export async function getGatewayPaymentStatus(externalId: string) {
  const res = await apiClient
    .get(`pos/gateway/payments/${externalId}/status`)
    .json<{ data: GatewayPaymentStatusResponse }>()
  return res.data
}
