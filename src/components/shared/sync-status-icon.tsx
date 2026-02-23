import { CheckCircle, Clock, ArrowsClockwise, WarningCircle } from '@phosphor-icons/react'
import type { SyncStatus } from '@/db/schema'

export function SyncStatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case 'synced':
      return <CheckCircle size={14} weight="fill" className="text-success" />
    case 'pending':
      return <Clock size={14} weight="fill" className="text-muted-foreground" />
    case 'syncing':
      return <ArrowsClockwise size={14} weight="bold" className="text-primary animate-spin" />
    case 'failed':
      return <WarningCircle size={14} weight="fill" className="text-destructive" />
  }
}
