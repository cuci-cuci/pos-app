import { Outlet } from '@tanstack/react-router'
import { Header } from './header'
import { BottomNav } from './bottom-nav'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />
      <main className="flex-1 pb-20 md:pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
