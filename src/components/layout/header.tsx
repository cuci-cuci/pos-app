import { useState } from 'react'
import { useDeviceStore } from '@/stores/device-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { Storefront } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const outletName = useDeviceStore((s) => s.outletName)
  const deviceName = useDeviceStore((s) => s.deviceName)
  const { isOnline, isSyncing, pendingCount } = useSyncStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const syncDotColor = isSyncing
    ? 'bg-blue-500 animate-pulse'
    : pendingCount > 0
      ? 'bg-amber-500'
      : isOnline
        ? 'bg-green-500'
        : 'bg-red-500'

  const firstName = user?.name?.split(' ')[0] ?? ''
  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        {/* Left: outlet + device */}
        <div className="flex items-center gap-2 min-w-0">
          <Storefront size={22} className="text-primary shrink-0" weight="fill" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{outletName || 'LaundryPOS'}</p>
            {deviceName && (
              <p className="text-[10px] text-muted-foreground leading-tight truncate">{deviceName}</p>
            )}
          </div>
        </div>

        {/* Center: sync dot */}
        <div className="flex items-center justify-center">
          <span className={cn('inline-block w-2.5 h-2.5 rounded-full', syncDotColor)} />
        </div>

        {/* Right: user */}
        <button
          type="button"
          onClick={() => setUserMenuOpen(true)}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[120px]">
            {firstName}
          </span>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {avatarLetter}
          </div>
        </button>
      </header>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} />
    </>
  )
}
