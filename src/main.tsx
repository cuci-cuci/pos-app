import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from '@/stores/auth-store'
import { syncEngine } from '@/sync/sync-engine'

// Initialize sync engine if user is already authenticated
const isAuthenticated = useAuthStore.getState().isAuthenticated()
if (isAuthenticated) {
  void syncEngine.init()
}

// Re-initialize sync on auth changes
useAuthStore.subscribe((state, prevState) => {
  const wasAuth = prevState.token !== null && prevState.user !== null
  const isAuth = state.token !== null && state.user !== null

  if (!wasAuth && isAuth) {
    void syncEngine.init()
  } else if (wasAuth && !isAuth) {
    syncEngine.destroy()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
