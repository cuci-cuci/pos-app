import { Suspense, lazy } from 'react'
import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { RouteErrorFallback } from '@/components/shared/error-boundary'
import {
  AnalyticsSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
  ManageListSkeleton,
  ServiceGridSkeleton,
  TransactionListSkeleton,
} from '@/components/shared/skeleton-loaders'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'

// Lazy-loaded page components
const LoginPage = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() =>
  import('@/pages/register').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/forgot-password').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/reset-password').then((m) => ({ default: m.ResetPasswordPage })),
)
const OrderTrackingPage = lazy(() =>
  import('@/pages/tracking').then((m) => ({ default: m.OrderTrackingPage })),
)
const OnboardingPage = lazy(() =>
  import('@/pages/onboarding').then((m) => ({ default: m.OnboardingPage })),
)
const SetupPage = lazy(() => import('@/pages/setup').then((m) => ({ default: m.SetupPage })))
const PosPage = lazy(() => import('@/pages/pos').then((m) => ({ default: m.PosPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const TransactionsPage = lazy(() =>
  import('@/pages/transactions').then((m) => ({ default: m.TransactionsPage })),
)
const TransactionDetailPage = lazy(() =>
  import('@/pages/transaction-detail-page').then((m) => ({ default: m.TransactionDetailPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((m) => ({ default: m.SettingsPage })),
)
const OrdersPage = lazy(() => import('@/pages/orders').then((m) => ({ default: m.OrdersPage })))
const OrderDetailPage = lazy(() =>
  import('@/pages/orders/detail').then((m) => ({ default: m.OrderDetailPage })),
)
const ShiftsPage = lazy(() =>
  import('@/pages/shifts/index').then((m) => ({ default: m.ShiftsPage })),
)
const ShiftDetailPage = lazy(() =>
  import('@/pages/shifts/detail').then((m) => ({ default: m.ShiftDetailPage })),
)
const ManagePage = lazy(() => import('@/pages/manage').then((m) => ({ default: m.ManagePage })))
const ManageOutletsPage = lazy(() =>
  import('@/pages/manage/outlets').then((m) => ({ default: m.ManageOutletsPage })),
)
const ManagePricingPage = lazy(() =>
  import('@/pages/manage/pricing').then((m) => ({ default: m.ManagePricingPage })),
)
const ManageCashiersPage = lazy(() =>
  import('@/pages/manage/cashiers').then((m) => ({ default: m.ManageCashiersPage })),
)
const ManagePaymentMethodsPage = lazy(() =>
  import('@/pages/manage/payment-methods').then((m) => ({
    default: m.ManagePaymentMethodsPage,
  })),
)
const ManageMembersPage = lazy(() =>
  import('@/pages/manage/members').then((m) => ({ default: m.ManageMembersPage })),
)
const ManageStoreSettingsPage = lazy(() =>
  import('@/pages/manage/store-settings').then((m) => ({ default: m.ManageStoreSettingsPage })),
)
const ManageSubscriptionPage = lazy(() =>
  import('@/pages/manage/subscription').then((m) => ({ default: m.ManageSubscriptionPage })),
)
const ManageNotificationsPage = lazy(() =>
  import('@/pages/manage/notifications').then((m) => ({ default: m.ManageNotificationsPage })),
)
const ManageAnalyticsPage = lazy(() =>
  import('@/pages/manage/analytics').then((m) => ({ default: m.ManageAnalyticsPage })),
)
const ManageFinancePage = lazy(() =>
  import('@/pages/manage/finance').then((m) => ({ default: m.ManageFinancePage })),
)
const ManageFinanceExpensesPage = lazy(() =>
  import('@/pages/manage/finance-expenses').then((m) => ({
    default: m.ManageFinanceExpensesPage,
  })),
)
const ManageFinancePnlPage = lazy(() =>
  import('@/pages/manage/finance-pnl').then((m) => ({ default: m.ManageFinancePnlPage })),
)
const ManageFinanceTaxPage = lazy(() =>
  import('@/pages/manage/finance-tax').then((m) => ({ default: m.ManageFinanceTaxPage })),
)
const ManageInventoryPage = lazy(() =>
  import('@/pages/manage/inventory').then((m) => ({ default: m.ManageInventoryPage })),
)
const ManageStaffPage = lazy(() =>
  import('@/pages/manage/staff').then((m) => ({ default: m.ManageStaffPage })),
)
const ManageDeliveryZonesPage = lazy(() =>
  import('@/pages/manage/delivery-zones').then((m) => ({
    default: m.ManageDeliveryZonesPage,
  })),
)
const ManageDeliveryRequestsPage = lazy(() =>
  import('@/pages/manage/delivery-requests').then((m) => ({
    default: m.ManageDeliveryRequestsPage,
  })),
)
const ManageServiceSuppliesPage = lazy(() =>
  import('@/pages/manage/service-supplies').then((m) => ({
    default: m.ManageServiceSuppliesPage,
  })),
)

// Suspense wrapper helper
function withSuspense(
  Component: React.LazyExoticComponent<React.ComponentType>,
  Fallback: React.ComponentType = () => null,
) {
  return function LazyRoute() {
    return (
      <Suspense fallback={<Fallback />}>
        <Component />
      </Suspense>
    )
  }
}

const rootRoute = createRootRoute({})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: withSuspense(LoginPage),
})

const trackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/track/$token',
  component: withSuspense(OrderTrackingPage),
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: withSuspense(ForgotPasswordPage),
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: withSuspense(ResetPasswordPage),
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: withSuspense(RegisterPage),
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
  component: withSuspense(OnboardingPage),
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
  component: withSuspense(SetupPage),
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
  errorComponent: RouteErrorFallback,
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
  component: withSuspense(PosPage, ServiceGridSkeleton),
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
  component: withSuspense(DashboardPage, DashboardSkeleton),
})

const transactionsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/transactions',
  component: withSuspense(TransactionsPage, TransactionListSkeleton),
})

const transactionDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/transactions/$id',
  component: withSuspense(TransactionDetailPage, DetailSkeleton),
})

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/settings',
  component: withSuspense(SettingsPage),
})

const requireOwner = () => {
  const user = useAuthStore.getState().user
  if (user?.role !== 'tenant_owner') {
    throw redirect({ to: '/' })
  }
}

const manageRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage',
  component: withSuspense(ManagePage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageOutletsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/outlets',
  component: withSuspense(ManageOutletsPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const managePricingRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/pricing',
  component: withSuspense(ManagePricingPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageCashiersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/cashiers',
  component: withSuspense(ManageCashiersPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const managePaymentMethodsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/payment-methods',
  component: withSuspense(ManagePaymentMethodsPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageMembersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/members',
  component: withSuspense(ManageMembersPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const ordersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders',
  component: withSuspense(OrdersPage, TransactionListSkeleton),
})

const orderDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/orders/$id',
  component: withSuspense(OrderDetailPage, DetailSkeleton),
})

const shiftsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/shifts',
  component: withSuspense(ShiftsPage, TransactionListSkeleton),
})

const shiftDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/shifts/$id',
  component: withSuspense(ShiftDetailPage, DetailSkeleton),
})

const manageStoreSettingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/store-settings',
  component: withSuspense(ManageStoreSettingsPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageSubscriptionRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/subscription',
  component: withSuspense(ManageSubscriptionPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageNotificationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/notifications',
  component: withSuspense(ManageNotificationsPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageAnalyticsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/analytics',
  component: withSuspense(ManageAnalyticsPage, AnalyticsSkeleton),
  beforeLoad: requireOwner,
})

const manageFinanceRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/finance',
  component: withSuspense(ManageFinancePage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageFinanceExpensesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/finance/expenses',
  component: withSuspense(ManageFinanceExpensesPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageFinancePnlRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/finance/pnl',
  component: withSuspense(ManageFinancePnlPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageFinanceTaxRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/finance/tax',
  component: withSuspense(ManageFinanceTaxPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageInventoryRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/inventory',
  component: withSuspense(ManageInventoryPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageStaffRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/staff',
  component: withSuspense(ManageStaffPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageDeliveryZonesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/delivery-zones',
  component: withSuspense(ManageDeliveryZonesPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageDeliveryRequestsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/delivery-requests',
  component: withSuspense(ManageDeliveryRequestsPage, ManageListSkeleton),
  beforeLoad: requireOwner,
})

const manageServiceSuppliesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/service-supplies',
  component: withSuspense(ManageServiceSuppliesPage, ManageListSkeleton),
  beforeLoad: requireOwner,
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
    manageFinanceRoute,
    manageFinanceExpensesRoute,
    manageFinancePnlRoute,
    manageFinanceTaxRoute,
    manageInventoryRoute,
    manageServiceSuppliesRoute,
    manageStaffRoute,
    manageDeliveryZonesRoute,
    manageDeliveryRequestsRoute,
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
