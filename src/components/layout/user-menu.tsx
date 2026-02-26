import { Clock, Gear, Monitor, SignOut, Storefront } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CloseShiftDialog } from '@/components/shift/close-shift-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { logout } from '@/services/auth-service'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { useShiftStore } from '@/stores/shift-store'
import { syncEngine } from '@/sync/sync-engine'

interface UserMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserMenu({ open, onOpenChange }: UserMenuProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const outletName = useDeviceStore((s) => s.outletName)
  const deviceName = useDeviceStore((s) => s.deviceName)
  const currentShift = useShiftStore((s) => s.currentShift)
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false)

  const handleSettings = () => {
    onOpenChange(false)
    void router.navigate({ to: '/settings' })
  }

  const handleCloseShift = () => {
    onOpenChange(false)
    setCloseShiftDialogOpen(true)
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Akun</SheetTitle>
          </SheetHeader>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 mb-4">
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

          <Separator />

          {/* Device info */}
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-3 text-sm">
              <Storefront size={18} weight="fill" className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Outlet</p>
                <p className="font-medium truncate">{outletName || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Monitor size={18} weight="fill" className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Perangkat</p>
                <p className="font-medium truncate">{deviceName || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1 px-2 py-2">
            {currentShift && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 text-warning hover:text-warning"
                onClick={handleCloseShift}
              >
                <Clock size={20} weight="fill" />
                Tutup Shift
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
              onClick={handleSettings}
            >
              <Gear size={20} weight="fill" />
              Pengaturan
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive"
              onClick={() => void handleLogout()}
            >
              <SignOut size={20} weight="fill" />
              Keluar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CloseShiftDialog open={closeShiftDialogOpen} onOpenChange={setCloseShiftDialogOpen} />
    </>
  )
}
