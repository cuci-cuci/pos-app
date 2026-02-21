import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/routes'
import { ToastContainer } from '@/components/ui/toast'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}
