import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { useSyncStore } from '@/stores/sync-store'
import { syncEngine } from '@/sync/sync-engine'
import { logout } from '@/services/auth-service'
import { useRouter } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/components/ui/toast'
import { APP_NAME, ROLE_TENANT_OWNER } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/format'
import {
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  CloudCheck,
  AlertTriangle,
  Smartphone,
  Store,
  CircleUser,
  Wrench,
  Trash,
  Info,
} from 'lucide-react'

export function SettingsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingCount,
    failedCount,
    configVersion,
  } = useSyncStore()

  const {
    deviceId,
    deviceName,
    outletName,
    setupCompletedAt,
  } = useDeviceStore()

  const [syncing, setSyncing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const isOwner = user?.role === ROLE_TENANT_OWNER

  const tenantConfig = useLiveQuery(
    () => db.tenantConfig.toCollection().first(),
    []
  )

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncEngine.triggerSync()
      showToast('Sinkronisasi berhasil', 'success')
    } catch {
      showToast('Sinkronisasi gagal', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleClearCache = async () => {
    setClearing(true)
    try {
      await db.serviceCategories.clear()
      await db.services.clear()
      await db.paymentMethods.clear()
      await db.customers.clear()
      await db.outlets.clear()
      await db.syncLogs.clear()
      showToast('Cache berhasil dibersihkan. Sinkronisasi ulang diperlukan.', 'info')
      // Trigger re-pull after clearing cache
      await syncEngine.triggerSync()
    } catch {
      showToast('Gagal membersihkan cache', 'error')
    } finally {
      setClearing(false)
    }
  }

  const handleLogout = async () => {
    syncEngine.destroy()
    await logout()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full pb-6">
        <h1 className="text-xl font-bold">Pengaturan</h1>

        {/* Device info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone size={18} />
              Perangkat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Perangkat</span>
              <span className="font-medium">{deviceName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Perangkat</span>
              <span className="font-mono text-xs text-muted-foreground">
                {deviceId.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outlet</span>
              <span className="font-medium">{outletName || '-'}</span>
            </div>
            {setupCompletedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup Selesai</span>
                <span className="text-muted-foreground">
                  {formatDate(setupCompletedAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw size={18} />
              Sinkronisasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status Jaringan</span>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi size={16} className="text-success" />
                    <span className="text-sm text-success">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-destructive" />
                    <span className="text-sm text-destructive">Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Sinkronisasi Terakhir</span>
              <span className="text-sm text-muted-foreground">
                {lastSyncAt
                  ? `${formatDate(lastSyncAt)} ${formatTime(lastSyncAt)}`
                  : 'Belum pernah'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Transaksi Menunggu</span>
              <Badge variant={pendingCount > 0 ? 'secondary' : 'success'}>
                {pendingCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <CloudCheck size={12} /> {pendingCount}
                  </span>
                ) : (
                  'Semua tersinkron'
                )}
              </Badge>
            </div>

            {failedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Transaksi Gagal</span>
                <Badge variant="destructive">
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={12} /> {failedCount}
                  </span>
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">Versi Konfigurasi</span>
              <span className="text-sm text-muted-foreground">v{configVersion}</span>
            </div>

            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={handleSync}
              disabled={syncing || isSyncing || !isOnline}
            >
              <RefreshCw
                size={18}
                className={syncing || isSyncing ? 'animate-spin mr-2' : 'mr-2'}
              />
              {syncing || isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </Button>
          </CardContent>
        </Card>

        {/* Tenant info - owner only */}
        {isOwner && tenantConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Store size={18} />
                Toko
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{tenantConfig.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alamat</span>
                <span className="font-medium text-right max-w-[200px]">
                  {tenantConfig.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telepon</span>
                <span className="font-medium">{tenantConfig.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak</span>
                <span className="font-medium">{tenantConfig.taxRate}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleUser size={18} />
              Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Advanced - owner only */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench size={18} />
                Lanjutan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-muted-foreground" />
                  <span className="text-sm">Versi Aplikasi</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {APP_NAME} v1.0.0
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearCache}
                disabled={clearing}
              >
                <Trash size={18} className="mr-2" />
                {clearing ? 'Membersihkan...' : 'Bersihkan Cache'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Logout */}
        {showLogoutConfirm ? (
          <Card className="border-destructive">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-center">
                Yakin ingin keluar? Transaksi yang belum tersinkron tetap tersimpan di perangkat.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-11"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  Keluar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={20} className="mr-2" />
            Keluar
          </Button>
        )}
      </div>
    </div>
  )
}
