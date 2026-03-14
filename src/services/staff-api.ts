import { apiClient } from './api-client'

export interface StaffActivity {
  id: string
  user_id: string
  user_name: string
  activity_type: string
  reference_id?: string
  reference_type?: string
  amount: number
  notes?: string
  created_at: string
}

export interface StaffSummary {
  user_id: string
  name: string
  tx_count: number
  revenue: number
  cancel_count: number
  refund_count: number
  cancel_amount: number
  refund_amount: number
}

export const staffApi = {
  listActivities: (params?: { user_id?: string; limit?: number }) =>
    apiClient.get('owner/staff/activities', { searchParams: params as Record<string, string> }).json<{ data: StaffActivity[] }>(),

  getSummaries: (days = 30) =>
    apiClient.get('owner/staff/summaries', { searchParams: { days } }).json<{ data: StaffSummary[] }>(),
}
