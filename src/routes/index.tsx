import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { OnboardingPage } from '@/pages/onboarding'
import { SetupPage } from '@/pages/setup'
import { PosPage } from '@/pages/pos'
import { DashboardPage } from '@/pages/dashboard'
import { TransactionsPage } from '@/pages/transactions'
import { TransactionDetailPage } from '@/pages/transaction-detail-page'
import { SettingsPage } from '@/pages/settings'
import { ManagePage } from '@/pages/manage'
import { ManageOutletsPage } from '@/pages/manage/outlets'
import { ManagePricingPage } from '@/pages/manage/pricing'
import { ManageCashiersPage } from '@/pages/manage/cashiers'
import { ManagePaymentMethodsPage } from '@/pages/manage/payment-methods'
import { ManageMembersPage } from '@/pages/manage/members'
import { ManageAnalyticsPage } from '@/pages/manage/analytics'
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

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
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
    const authState = useAuthStore.getState()
    const isAuthenticated = authState.isAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }

    if (
      authState.user?.role === 'tenant_owner' &&
      !authState.onboardingComplete
    ) {
      throw redirect({ to: '/onboarding' })
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

const manageRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage',
  component: ManagePage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageOutletsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/outlets',
  component: ManageOutletsPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const managePricingRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/pricing',
  component: ManagePricingPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageCashiersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/cashiers',
  component: ManageCashiersPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const managePaymentMethodsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/payment-methods',
  component: ManagePaymentMethodsPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageMembersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/members',
  component: ManageMembersPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageAnalyticsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/analytics',
  component: ManageAnalyticsPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  onboardingRoute,
  setupRoute,
  authenticatedRoute.addChildren([
    posRoute,
    dashboardRoute,
    transactionsRoute,
    transactionDetailRoute,
    settingsRoute,
    manageRoute,
    manageOutletsRoute,
    managePricingRoute,
    manageCashiersRoute,
    managePaymentMethodsRoute,
    manageMembersRoute,
    manageAnalyticsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
