import { useRouter, useMatches } from '@tanstack/react-router'
import { Store, Receipt, Settings, BarChart3, MoreHorizontal, Wrench, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  icon: LucideIcon
  path: string
}

const cashierNavItems: NavItem[] = [
  { label: 'Kasir', icon: Store, path: '/' },
  { label: 'Pesanan', icon: Package, path: '/orders' },
  { label: 'Riwayat', icon: Receipt, path: '/transactions' },
  { label: 'Pengaturan', icon: Settings, path: '/settings' },
]

const ownerNavItems: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { label: 'Kasir', icon: Store, path: '/' },
  { label: 'Pesanan', icon: Package, path: '/orders' },
  { label: 'Kelola', icon: Wrench, path: '/manage' },
  { label: 'Lainnya', icon: MoreHorizontal, path: '/settings' },
]

export function BottomNav() {
  const router = useRouter()
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? '/'
  const role = useAuthStore((s) => s.user?.role)

  const navItems = role === 'tenant_owner' ? ownerNavItems : cashierNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path)

          return (
            <button
              type="button"
              key={item.path}
              onClick={() => router.navigate({ to: item.path })}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] px-2 py-1.5 transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-0.5 bg-primary rounded-b" />
              )}
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
