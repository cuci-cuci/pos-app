import { apiClient } from './api-client'

export const ownerApi = {
  // Outlets
  listOutlets: (page = 1) =>
    apiClient.get('owner/outlets', { searchParams: { page } }).json<any>(),
  createOutlet: (data: Record<string, unknown>) =>
    apiClient.post('owner/outlets', { json: data }).json<any>(),
  updateOutlet: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`owner/outlets/${id}`, { json: data }).json<any>(),

  // Services & Pricing
  listServices: () => apiClient.get('owner/services').json<any>(),
  setServicePrice: (templateId: string, data: Record<string, unknown>) =>
    apiClient.put(`owner/service-prices/${templateId}`, { json: data }).json<any>(),
  bulkSetPrices: (data: Record<string, unknown>) =>
    apiClient.put('owner/service-prices/bulk', { json: data }).json<any>(),

  // Payment Methods
  listPaymentMethods: (page = 1) =>
    apiClient.get('owner/payment-methods', { searchParams: { page } }).json<any>(),
  createPaymentMethod: (data: Record<string, unknown>) =>
    apiClient.post('owner/payment-methods', { json: data }).json<any>(),
  updatePaymentMethod: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`owner/payment-methods/${id}`, { json: data }).json<any>(),
  deletePaymentMethod: (id: string) =>
    apiClient.delete(`owner/payment-methods/${id}`).json<any>(),

  // Cashiers
  listCashiers: (page = 1) =>
    apiClient.get('owner/cashiers', { searchParams: { page } }).json<any>(),
  createCashier: (data: Record<string, unknown>) =>
    apiClient.post('owner/cashiers', { json: data }).json<any>(),
  updateCashier: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`owner/cashiers/${id}`, { json: data }).json<any>(),

  // Members
  listMembers: (page = 1) =>
    apiClient.get('owner/members', { searchParams: { page } }).json<any>(),
  createMember: (data: Record<string, unknown>) =>
    apiClient.post('owner/members', { json: data }).json<any>(),
  updateMember: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`owner/members/${id}`, { json: data }).json<any>(),

  // Analytics
  analyticsSummary: (params: Record<string, string>) =>
    apiClient.get('owner/analytics/summary', { searchParams: params }).json<any>(),
  analyticsOutlets: (params: Record<string, string>) =>
    apiClient.get('owner/analytics/outlets', { searchParams: params }).json<any>(),
  dailyRevenue: (params: Record<string, string>) =>
    apiClient.get('owner/analytics/daily-revenue', { searchParams: params }).json<any>(),
}
