import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/routes'
import { ToastContainer } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/shared/error-boundary'

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  )
}
