import { Clock, Storefront, WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatTime } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { useShiftStore } from '@/stores/shift-store'
import { useSyncStore } from '@/stores/sync-store'
import { UserMenu } from './user-menu'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const outletName = useDeviceStore((s) => s.outletName)
  const deviceName = useDeviceStore((s) => s.deviceName)
  const { isOnline, isSyncing } = useSyncStore()
  const currentShift = useShiftStore((s) => s.currentShift)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const firstName = user?.name?.split(' ')[0] ?? ''
  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? '?'
  const shiftTime = currentShift?.opened_at ? formatTime(currentShift.opened_at) : ''

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        {/* Left: outlet + device */}
        <div className="flex items-center gap-2 min-w-0">
          <Storefront size={22} weight="fill" className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {outletName || 'kelarin'}
            </p>
            {deviceName && (
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {deviceName}
              </p>
            )}
          </div>
        </div>

        {/* Center: status + shift info */}
        <div className="flex items-center gap-2">
          {/* Online / Offline */}
          {isOnline ? (
            <span
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium',
                'bg-success/10 text-success',
                isSyncing && 'animate-pulse',
              )}
            >
              <WifiHigh size={13} weight="bold" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive">
              <WifiSlash size={13} weight="bold" />
              Offline
            </span>
          )}

          {/* Shift info */}
          {currentShift && (
            <>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock size={12} weight="fill" />
                {shiftTime}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Kas {formatCurrency(currentShift.opening_cash)}
              </span>
            </>
          )}
        </div>

        {/* Right: user */}
        <button
          type="button"
          onClick={() => setUserMenuOpen(true)}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="hidden sm:block min-w-0 text-right">
            <p className="text-sm font-medium leading-tight truncate max-w-[120px]">
              {firstName}
            </p>
            {user?.email && (
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
                {user.email}
              </p>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {avatarLetter}
          </div>
        </button>
      </header>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} />
    </>
  )
}
