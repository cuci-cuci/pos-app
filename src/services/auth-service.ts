import { apiClient } from './api-client'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { db } from '@/db'

interface APILoginResponse {
  data: {
    access_token: string
    refresh_token: string
    user: {
      id: string
      name: string
      email: string
      role: string
      tenant_id?: string
    }
  }
}

interface APIRefreshResponse {
  data: {
    access_token: string
    refresh_token: string
  }
}

export async function login(email: string, password: string): Promise<void> {
  const response = await apiClient
    .post('auth/login', {
      json: { email, password },
    })
    .json<APILoginResponse>()

  const { access_token, refresh_token, user } = response.data
  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id ?? '',
  }
  useAuthStore.getState().login(access_token, refresh_token, authUser)
}

export async function refresh(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await apiClient
    .post('auth/refresh', {
      json: { refresh_token: refreshToken },
    })
    .json<APIRefreshResponse>()

  const user = useAuthStore.getState().user
  if (user) {
    useAuthStore.getState().login(
      response.data.access_token,
      response.data.refresh_token,
      user
    )
  }
}

export async function logout(): Promise<void> {
  useAuthStore.getState().logout()
  await db.serviceCategories.clear()
  await db.services.clear()
  await db.paymentMethods.clear()
  await db.tenantConfig.clear()
  await db.customers.clear()
  await db.outlets.clear()
  await db.syncState.clear()
  await db.syncLogs.clear()
}
