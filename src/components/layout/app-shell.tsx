import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useShiftStore } from '@/stores/shift-store'
import { Header } from './header'
import { BottomNav } from './bottom-nav'

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
