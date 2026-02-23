import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useShiftStore } from '@/stores/shift-store'
import { BottomNav } from './bottom-nav'
import { Header } from './header'

export function AppShell() {
  useEffect(() => {
    useShiftStore.getState().fetchCurrentShift()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
