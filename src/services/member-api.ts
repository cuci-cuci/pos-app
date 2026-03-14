import { apiClient } from './api-client'

export interface MemberSearchResult {
  id: string
  name: string
  phone: string
  email?: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  total_spending: number
  total_points: number
  discount_percent: number
}

export interface MemberSearchResponse {
  data: MemberSearchResult[]
}

export interface MemberRegisterInput {
  name: string
  phone: string
  email?: string
  referral_code?: string
}

export interface MemberRegisterResponse {
  data: MemberSearchResult
}

export interface RedeemPointsResponse {
  data: {
    discount_amount: number
    remaining_points: number
    points_redeemed: number
  }
}

export const memberApi = {
  search: (phone: string) =>
    apiClient.get('pos/members/search', { searchParams: { phone } }).json<MemberSearchResponse>(),

  register: (data: MemberRegisterInput) =>
    apiClient.post('pos/members', { json: data }).json<MemberRegisterResponse>(),

  redeemPoints: (memberId: string, points: number) =>
    apiClient.post(`pos/members/${memberId}/redeem`, { json: { points } }).json<RedeemPointsResponse>(),

  awardPoints: (memberId: string, transactionAmount: number) =>
    apiClient.post(`pos/members/${memberId}/award-points`, { json: { transaction_amount: transactionAmount } }).json<{ data: { points_earned: number } }>(),
}
