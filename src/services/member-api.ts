import { apiClient } from './api-client'

export interface MemberSearchResult {
  id: string
  name: string
  phone: string
  email?: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_spending: number
  discount_percent: number
}

export interface MemberSearchResponse {
  data: MemberSearchResult[]
}

export interface MemberRegisterInput {
  name: string
  phone: string
  email?: string
}

export interface MemberRegisterResponse {
  data: MemberSearchResult
}

export const memberApi = {
  search: (phone: string) =>
    apiClient.get('pos/members/search', { searchParams: { phone } }).json<MemberSearchResponse>(),

  register: (data: MemberRegisterInput) =>
    apiClient.post('pos/members', { json: data }).json<MemberRegisterResponse>(),
}
