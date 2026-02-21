import { useRouter, useMatches } from '@tanstack/react-router'
import { Storefront, Receipt, GearSix } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: typeof Storefront
  path: string
}

const navItems: NavItem[] = [
  { label: 'POS', icon: Storefront, path: '/' },
  { label: 'Transaksi', icon: Receipt, path: '/transactions' },
  { label: 'Pengaturan', icon: GearSix, path: '/settings' },
]

export function BottomNav() {
  const router = useRouter()
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.fullPath ?? '/'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--border)] md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => router.navigate({ to: item.path })}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)]'
              )}
            >
              <item.icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
