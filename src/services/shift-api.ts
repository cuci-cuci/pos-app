import { apiClient } from './api-client'

export interface Shift {
  id: string
  tenant_id: string
  outlet_id: string
  cashier_id: string
  opening_cash: number
  closing_cash?: number
  expected_cash?: number
  cash_difference?: number
  status: string
  opened_at: string
  closed_at?: string
  notes?: string
  created_at: string
}

export interface ShiftPaymentBreakdown {
  payment_type: string
  count: number
  amount: number
}

export interface ShiftSummary extends Shift {
  cashier_name: string
  transaction_count: number
  total_revenue: number
  payment_breakdown: ShiftPaymentBreakdown[]
}

export interface ShiftResponse {
  data: Shift
}

export interface ShiftNullableResponse {
  data: Shift | null
}

export interface ShiftListResponse {
  data: Shift[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface ShiftSummaryResponse {
  data: ShiftSummary
}

export const shiftApi = {
  open: (data: { outlet_id: string; opening_cash: number }) =>
    apiClient.post('pos/shifts/open', { json: data }).json<ShiftResponse>(),

  close: (data: { closing_cash: number; notes?: string }) =>
    apiClient.post('pos/shifts/close', { json: data }).json<ShiftResponse>(),

  getCurrent: () =>
    apiClient.get('pos/shifts/current').json<ShiftNullableResponse>(),

  list: (page = 1) =>
    apiClient
      .get('pos/shifts', { searchParams: { page } })
      .json<ShiftListResponse>(),

  getSummary: (id: string) =>
    apiClient.get(`pos/shifts/${id}/summary`).json<ShiftSummaryResponse>(),
}
