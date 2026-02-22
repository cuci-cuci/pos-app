import { CheckCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react'
import type { SyncStatus } from '@/db/schema'

export function SyncStatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case 'synced':
      return <CheckCircle size={14} className="text-success" />
    case 'pending':
      return <Clock size={14} className="text-muted-foreground" />
    case 'syncing':
      return <RefreshCw size={14} className="text-primary animate-spin" />
    case 'failed':
      return <AlertTriangle size={14} className="text-destructive" />
  }
}
