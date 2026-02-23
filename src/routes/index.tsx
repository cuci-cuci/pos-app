import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/pages/dashboard'
import { ForgotPasswordPage } from '@/pages/forgot-password'
import { LoginPage } from '@/pages/login'
import { ManagePage } from '@/pages/manage'
import { ManageAnalyticsPage } from '@/pages/manage/analytics'
import { ManageCashiersPage } from '@/pages/manage/cashiers'
import { ManageMembersPage } from '@/pages/manage/members'
import { ManageOutletsPage } from '@/pages/manage/outlets'
import { ManagePaymentMethodsPage } from '@/pages/manage/payment-methods'
import { ManagePricingPage } from '@/pages/manage/pricing'
import { ManageStoreSettingsPage } from '@/pages/manage/store-settings'
import { ManageNotificationsPage } from '@/pages/manage/notifications'
import { ManageSubscriptionPage } from '@/pages/manage/subscription'
import { OrderTrackingPage } from '@/pages/tracking'
import { OnboardingPage } from '@/pages/onboarding'
import { OrdersPage } from '@/pages/orders'
import { OrderDetailPage } from '@/pages/orders/detail'
import { PosPage } from '@/pages/pos'
import { RegisterPage } from '@/pages/register'
import { ResetPasswordPage } from '@/pages/reset-password'
import { SettingsPage } from '@/pages/settings'
import { SetupPage } from '@/pages/setup'
import { ShiftDetailPage } from '@/pages/shifts/detail'
import { ShiftsPage } from '@/pages/shifts/index'
import { TransactionDetailPage } from '@/pages/transaction-detail-page'
import { TransactionsPage } from '@/pages/transactions'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const trackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/track/$token',
  component: OrderTrackingPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
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

    if (authState.user?.role === 'tenant_owner' && !authState.onboardingComplete) {
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
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role === 'tenant_owner') {
      throw redirect({ to: '/dashboard' })
    }
  },
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

const ordersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders',
  component: OrdersPage,
})

const orderDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders/$id',
  component: OrderDetailPage,
})

const shiftsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/shifts',
  component: ShiftsPage,
})

const shiftDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/shifts/$id',
  component: ShiftDetailPage,
})

const manageStoreSettingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/store-settings',
  component: ManageStoreSettingsPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageSubscriptionRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/subscription',
  component: ManageSubscriptionPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user?.role !== 'tenant_owner') {
      throw redirect({ to: '/' })
    }
  },
})

const manageNotificationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/notifications',
  component: ManageNotificationsPage,
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
  forgotPasswordRoute,
  resetPasswordRoute,
  trackingRoute,
  registerRoute,
  onboardingRoute,
  setupRoute,
  authenticatedRoute.addChildren([
    posRoute,
    dashboardRoute,
    transactionsRoute,
    transactionDetailRoute,
    settingsRoute,
    ordersRoute,
    orderDetailRoute,
    manageRoute,
    manageOutletsRoute,
    managePricingRoute,
    manageCashiersRoute,
    managePaymentMethodsRoute,
    manageMembersRoute,
    manageAnalyticsRoute,
    manageNotificationsRoute,
    manageSubscriptionRoute,
    manageStoreSettingsRoute,
    shiftsRoute,
    shiftDetailRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
