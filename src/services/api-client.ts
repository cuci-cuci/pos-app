import ky from 'ky'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'

export const apiClient = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().token
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          const refreshToken = useAuthStore.getState().refreshToken
          if (refreshToken) {
            try {
              const refreshResponse = await ky
                .post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                  json: { refreshToken },
                })
                .json<{ token: string; refreshToken: string }>()

              const state = useAuthStore.getState()
              if (state.user) {
                state.login(
                  refreshResponse.token,
                  refreshResponse.refreshToken,
                  state.user
                )
              }
            } catch {
              useAuthStore.getState().logout()
            }
          } else {
            useAuthStore.getState().logout()
          }
        }
      },
    ],
  },
})
