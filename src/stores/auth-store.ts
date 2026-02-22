import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  onboardingComplete: boolean
  isAuthenticated: () => boolean
  login: (token: string, refreshToken: string, user: AuthUser) => void
  logout: () => void
  setOnboardingComplete: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      onboardingComplete: false,
      isAuthenticated: () => {
        return get().token !== null && get().user !== null
      },
      login: (token, refreshToken, user) => {
        set({ token, refreshToken, user })
      },
      logout: () => {
        set({ token: null, refreshToken: null, user: null, onboardingComplete: false })
      },
      setOnboardingComplete: (value) => {
        set({ onboardingComplete: value })
      },
    }),
    {
      name: 'laundry-pos-auth',
    }
  )
)
