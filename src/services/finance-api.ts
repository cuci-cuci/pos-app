import { apiClient } from './api-client'

// --- Types ---

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  is_active: boolean
}

export interface Expense {
  id: string
  tenant_id: string
  outlet_id?: string
  category_id?: string
  amount: number
  description?: string
  expense_date: string
  category_name?: string
  outlet_name?: string
  created_at: string
}

export interface RecurringExpense {
  id: string
  amount: number
  description?: string
  frequency: string
  next_due_date: string
  is_active: boolean
}

export interface PnLReport {
  period: string
  start_date: string
  end_date: string
  revenue: number
  expenses: number
  gross_profit: number
  margin_percent: number
  expense_by_category: { category_name: string; amount: number }[]
}

export interface CashFlowReport {
  period: string
  cash_in: number
  cash_out: number
  net_flow: number
}

// --- API calls ---

export async function getExpenseCategories() {
  return apiClient.get('owner/expense-categories').json<{ data: ExpenseCategory[] }>()
}

export async function createExpenseCategory(req: { name: string; icon?: string }) {
  return apiClient.post('owner/expense-categories', { json: req }).json<{ data: ExpenseCategory }>()
}

export async function getExpenses(params: {
  start_date?: string
  end_date?: string
  category_id?: string
  outlet_id?: string
  page?: number
  per_page?: number
}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value))
  }
  return apiClient
    .get('owner/expenses', { searchParams })
    .json<{ data: { data: Expense[]; total: number; page: number } }>()
}

export async function createExpense(req: {
  category_id?: string
  outlet_id?: string
  amount: number
  description: string
  expense_date: string
}) {
  return apiClient.post('owner/expenses', { json: req }).json<{ data: Expense }>()
}

export async function updateExpense(
  id: string,
  req: { category_id?: string; outlet_id?: string; amount?: number; description?: string; expense_date?: string },
) {
  return apiClient.put(`owner/expenses/${id}`, { json: req }).json<{ data: Expense }>()
}

export async function deleteExpense(id: string) {
  return apiClient.delete(`owner/expenses/${id}`).json()
}

export async function getRecurringExpenses() {
  return apiClient.get('owner/recurring-expenses').json<{ data: RecurringExpense[] }>()
}

export async function createRecurringExpense(req: {
  category_id?: string
  outlet_id?: string
  amount: number
  description: string
  frequency: string
  next_due_date: string
}) {
  return apiClient.post('owner/recurring-expenses', { json: req }).json<{ data: RecurringExpense }>()
}

export async function getPnLReport(startDate: string, endDate: string) {
  return apiClient
    .get('owner/finance/pnl', { searchParams: { start_date: startDate, end_date: endDate } })
    .json<{ data: PnLReport }>()
}

export async function getCashFlowReport(startDate: string, endDate: string) {
  return apiClient
    .get('owner/finance/cashflow', { searchParams: { start_date: startDate, end_date: endDate } })
    .json<{ data: CashFlowReport }>()
}
