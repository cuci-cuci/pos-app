import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { syncEngine } from '@/sync/sync-engine'
import { logout } from '@/services/auth-service'
import { useRouter } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { showToast } from '@/components/ui/toast'
import {
  ArrowsClockwise,
  SignOut,
  WifiHigh,
  WifiSlash,
  CloudCheck,
  Warning,
} from '@phosphor-icons/react'
import { formatDate, formatTime } from '@/lib/format'
import { useState } from 'react'

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

  const [syncing, setSyncing] = useState(false)

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

  const handleLogout = async () => {
    syncEngine.destroy()
    await logout()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Sync status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowsClockwise size={18} />
            Status Sinkronisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status Jaringan</span>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <WifiHigh size={16} className="text-[var(--success)]" weight="bold" />
                  <span className="text-sm text-[var(--success)]">Online</span>
                </>
              ) : (
                <>
                  <WifiSlash size={16} className="text-[var(--destructive)]" weight="bold" />
                  <span className="text-sm text-[var(--destructive)]">Offline</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Sinkronisasi Terakhir</span>
            <span className="text-sm text-[var(--muted-foreground)]">
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
                  <Warning size={12} /> {failedCount}
                </span>
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm">Versi Konfigurasi</span>
            <span className="text-sm text-[var(--muted-foreground)]">v{configVersion}</span>
          </div>

          <Button
            className="w-full mt-2"
            variant="outline"
            onClick={handleSync}
            disabled={syncing || isSyncing || !isOnline}
          >
            <ArrowsClockwise
              size={18}
              className={syncing || isSyncing ? 'animate-spin mr-2' : 'mr-2'}
            />
            {syncing || isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </Button>
        </CardContent>
      </Card>

      {/* Tenant info */}
      {tenantConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informasi Toko</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Nama</span>
              <span className="font-medium">{tenantConfig.tenantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Alamat</span>
              <span className="font-medium text-right max-w-[200px]">{tenantConfig.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Telepon</span>
              <span className="font-medium">{tenantConfig.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Pajak</span>
              <span className="font-medium">{tenantConfig.taxRate}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Nama</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Role</span>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button
        variant="destructive"
        className="w-full h-12"
        onClick={handleLogout}
      >
        <SignOut size={20} className="mr-2" />
        Keluar
      </Button>
    </div>
  )
}
