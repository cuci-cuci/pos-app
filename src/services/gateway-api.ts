import { apiClient } from './api-client'

export interface GatewayPaymentResponse {
  id: string
  external_id: string
  gateway_status: string
  gateway_type: string
  amount: number
  gateway_payment_url?: string
  expires_at?: string
  created_at: string
}

export interface GatewayPaymentStatusResponse {
  external_id: string
  gateway_status: string
  paid_at?: string
  is_final: boolean
}

export async function createGatewayPayment(req: {
  transaction_id: string
  payment_item_id: string
  gateway_type: 'qris' | 'virtual_account' | 'ewallet'
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
