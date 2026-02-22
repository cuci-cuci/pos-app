import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { SetupPage } from '@/pages/setup'
import { PosPage } from '@/pages/pos'
import { DashboardPage } from '@/pages/dashboard'
import { TransactionsPage } from '@/pages/transactions'
import { TransactionDetailPage } from '@/pages/transaction-detail-page'
import { SettingsPage } from '@/pages/settings'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
})

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: SetupPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
})

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AppShell,
  beforeLoad: ({ location }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }

    const isReady = useDeviceStore.getState().isDeviceReady()
    if (!isReady && location.pathname !== '/setup') {
      throw redirect({ to: '/setup' })
    }
  },
})

const posRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: PosPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const transactionsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/transactions',
  component: TransactionsPage,
})

const transactionDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/transactions/$id',
  component: TransactionDetailPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  setupRoute,
  authenticatedRoute.addChildren([
    posRoute,
    dashboardRoute,
    transactionsRoute,
    transactionDetailRoute,
    settingsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
