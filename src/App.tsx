import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { ToastContainer } from '@/components/ui/toast'
import { router } from '@/routes'

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
      <PWAInstallPrompt />
    </ErrorBoundary>
  )
}
