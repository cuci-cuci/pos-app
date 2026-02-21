import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login'
import { PosPage } from '@/pages/pos'
import { TransactionsPage } from '@/pages/transactions'
import { TransactionDetailPage } from '@/pages/transaction-detail-page'
import { SettingsPage } from '@/pages/settings'
import { useAuthStore } from '@/stores/auth-store'

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AppShell,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
})

const posRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: PosPage,
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
  authenticatedRoute.addChildren([
    posRoute,
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
