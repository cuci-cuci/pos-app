import { useSyncStore } from '@/stores/sync-store'
import { ArrowsClockwise, WifiHigh, WifiSlash, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, hasConfigUpdate } = useSyncStore()

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <WifiHigh size={18} className="text-[var(--success)]" weight="bold" />
      ) : (
        <WifiSlash size={18} className="text-[var(--destructive)]" weight="bold" />
      )}

      {isSyncing && (
        <ArrowsClockwise size={18} className="text-[var(--primary)] animate-spin" />
      )}

      {pendingCount > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {pendingCount}
        </span>
      )}

      {hasConfigUpdate && (
        <span className={cn('relative flex h-2 w-2')}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
        </span>
      )}

      {!isOnline && (
        <Warning size={16} className="text-amber-500" weight="fill" />
      )}
    </div>
  )
}
