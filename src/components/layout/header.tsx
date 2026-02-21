import { APP_NAME } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'
import { SyncIndicator } from './sync-indicator'
import { UserCircle } from '@phosphor-icons/react'

export function Header() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)] px-4 h-14 flex items-center justify-between">
      <div className="font-bold text-[var(--primary)] text-lg">{APP_NAME}</div>
      <SyncIndicator />
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--muted-foreground)] hidden sm:block">
          {user?.name}
        </span>
        <UserCircle size={28} weight="fill" className="text-[var(--muted-foreground)]" />
      </div>
    </header>
  )
}
