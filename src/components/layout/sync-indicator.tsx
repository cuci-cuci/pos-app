import { useSyncStore } from '@/stores/sync-store'
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, hasConfigUpdate } = useSyncStore()

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi size={18} className="text-success" />
      ) : (
        <WifiOff size={18} className="text-destructive" />
      )}

      {isSyncing && (
        <RefreshCw size={18} className="text-primary animate-spin" />
      )}

      {pendingCount > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
        <AlertTriangle size={16} className="text-amber-500" />
      )}
    </div>
  )
}
