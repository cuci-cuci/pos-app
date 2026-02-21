import { apiClient } from './api-client'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { db } from '@/db'

interface LoginResponse {
  token: string
  refreshToken: string
  user: AuthUser
}

export async function login(email: string, password: string): Promise<void> {
  const response = await apiClient
    .post('api/v1/auth/login', {
      json: { email, password },
    })
    .json<LoginResponse>()

  useAuthStore.getState().login(response.token, response.refreshToken, response.user)
}

export async function refresh(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await apiClient
    .post('api/v1/auth/refresh', {
      json: { refreshToken },
    })
    .json<{ token: string; refreshToken: string }>()

  const user = useAuthStore.getState().user
  if (user) {
    useAuthStore.getState().login(response.token, response.refreshToken, user)
  }
}

export async function logout(): Promise<void> {
  useAuthStore.getState().logout()
  await db.serviceCategories.clear()
  await db.services.clear()
  await db.paymentMethods.clear()
  await db.tenantConfig.clear()
  await db.customers.clear()
  await db.syncState.clear()
  await db.syncLogs.clear()
}
