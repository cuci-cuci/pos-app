import { useSyncStore } from '@/stores/sync-store'
import { ArrowsClockwise, WifiHigh, WifiSlash, WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, hasConfigUpdate } = useSyncStore()

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <WifiHigh size={18} weight="fill" className="text-success" />
      ) : (
        <WifiSlash size={18} weight="fill" className="text-destructive" />
      )}

      {isSyncing && (
        <ArrowsClockwise size={18} weight="bold" className="text-primary animate-spin" />
      )}

      {pendingCount > 0 && (
        <span className="bg-warning text-warning-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {pendingCount}
        </span>
      )}

      {hasConfigUpdate && (
        <span className={cn('relative flex h-2 w-2')}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}

      {!isOnline && (
        <WarningCircle size={16} weight="fill" className="text-warning" />
      )}
    </div>
  )
}
