import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { ToastContainer } from '@/components/ui/toast'
import { router } from '@/routes'

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  )
}
