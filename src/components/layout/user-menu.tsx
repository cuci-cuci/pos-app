import { useRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { syncEngine } from '@/sync/sync-engine'
import { logout } from '@/services/auth-service'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GearSix, SignOut, Storefront, Desktop } from '@phosphor-icons/react'

interface UserMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserMenu({ open, onOpenChange }: UserMenuProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const outletName = useDeviceStore((s) => s.outletName)
  const deviceName = useDeviceStore((s) => s.deviceName)

  const handleSettings = () => {
    onOpenChange(false)
    void router.navigate({ to: '/settings' })
  }

  const handleLogout = async () => {
    onOpenChange(false)
    syncEngine.destroy()
    await logout()
    await router.navigate({ to: '/login' })
  }

  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? '?'

  const roleLabel: Record<string, string> = {
    tenant_owner: 'Pemilik',
    cashier: 'Kasir',
    admin: 'Admin',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Akun</SheetTitle>
        </SheetHeader>

        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{user?.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {roleLabel[user?.role ?? ''] ?? user?.role}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Device info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-sm">
            <Storefront size={18} className="text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Outlet</p>
              <p className="font-medium truncate">{outletName || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Desktop size={18} className="text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Perangkat</p>
              <p className="font-medium truncate">{deviceName || '-'}</p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={handleSettings}
          >
            <GearSix size={20} />
            Pengaturan
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive"
            onClick={() => void handleLogout()}
          >
            <SignOut size={20} />
            Keluar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
