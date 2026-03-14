import { apiClient } from './api-client'

export interface DashboardSummary {
  today_revenue: number
  today_transactions: number
  week_revenue: number
  month_revenue: number
  month_expenses: number
  month_profit: number
  margin_percent: number
  prev_month_revenue: number
  revenue_growth_pct: number
}

export interface CashierPerformanceItem {
  user_id: string
  name: string
  tx_count: number
  revenue: number
  avg_revenue: number
}

export interface CustomerInsightsData {
  new_customers: number
  returning_customers: number
  total_unique: number
}

export interface DashboardGoal {
  id: string
  goal_type: string
  target_value: number
  current_value: number
  is_active: boolean
}

export async function getDashboardSummary(outletId?: string) {
  const searchParams: Record<string, string | number> = {}
  if (outletId) searchParams.outlet_id = outletId
  return apiClient.get('owner/dashboard/summary', { searchParams }).json<{ data: DashboardSummary }>()
}

export async function getCashierPerformance(days = 30, outletId?: string) {
  const searchParams: Record<string, string | number> = { days }
  if (outletId) searchParams.outlet_id = outletId
  return apiClient
    .get('owner/dashboard/cashier-performance', { searchParams })
    .json<{ data: CashierPerformanceItem[] }>()
}

export async function getCustomerInsights(days = 30) {
  return apiClient
    .get('owner/dashboard/customer-insights', { searchParams: { days } })
    .json<{ data: CustomerInsightsData }>()
}

export async function getGoals() {
  return apiClient.get('owner/dashboard/goals').json<{ data: DashboardGoal[] }>()
}

export async function upsertGoal(goalType: string, targetValue: number) {
  return apiClient
    .put('owner/dashboard/goals', { json: { goal_type: goalType, target_value: targetValue } })
    .json<{ data: { status: string } }>()
}
