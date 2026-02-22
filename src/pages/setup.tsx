import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Outlet } from '@/db/schema'
import { useDeviceStore } from '@/stores/device-store'
import { useAuthStore } from '@/stores/auth-store'
import { apiClient } from '@/services/api-client'
import { syncEngine } from '@/sync/sync-engine'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, MapPin, Phone, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [selectedOutletName, setSelectedOutletName] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [outlets, setOutlets] = useState<Outlet[]>([])

  const user = useAuthStore((s) => s.user)
  const { setDevice, completeSetup } = useDeviceStore()

  const tenantConfig = useLiveQuery(
    () => db.tenantConfig.toCollection().first(),
    []
  )

  const localOutlets = useLiveQuery(
    () => db.outlets.toArray(),
    []
  )

  useEffect(() => {
    if (localOutlets && localOutlets.length > 0) {
      setOutlets(localOutlets)
    } else {
      void apiClient
        .get('pos/outlets')
        .json<{ data: Outlet[] }>()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setOutlets(res.data)
          }
        })
        .catch(() => {
          // Outlets not available yet
        })
    }
  }, [localOutlets])

  useEffect(() => {
    if (outlets.length === 1) {
      setSelectedOutletId(outlets[0].id)
      setSelectedOutletName(outlets[0].name)
    }
  }, [outlets])

  const handleComplete = async () => {
    setDevice({
      deviceName,
      outletId: selectedOutletId,
      outletName: selectedOutletName,
    })
    completeSetup()
    await syncEngine.init()
    await syncEngine.forceSync()
    void router.navigate({ to: '/' })
  }

  const tenantName = tenantConfig?.tenantName ?? 'Laundry'

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary' : 'w-2 bg-border'
              )}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store size={48} className="text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Selamat datang di LaundryPOS</h1>
              <p className="text-muted-foreground mb-2">{tenantName}</p>
              <p className="text-sm text-muted-foreground mb-8">
                Mari siapkan perangkat ini untuk mulai menerima transaksi.
              </p>
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                onClick={() => setStep(1)}
              >
                Mulai Pengaturan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Outlet Selection */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-1">Pilih Outlet / Cabang</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Perangkat ini akan terikat ke outlet yang dipilih
              </p>

              {outlets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Belum ada outlet tersedia. Silakan sinkronkan data terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {outlets.map((outlet) => (
                    <button
                      type="button"
                      key={outlet.id}
                      onClick={() => {
                        setSelectedOutletId(outlet.id)
                        setSelectedOutletName(outlet.name)
                      }}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all',
                        'hover:border-primary/50 active:scale-[0.99]',
                        selectedOutletId === outlet.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          selectedOutletId === outlet.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          <Store size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{outlet.name}</p>
                          {outlet.address && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{outlet.address}</span>
                            </p>
                          )}
                          {outlet.phone && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Phone size={12} className="shrink-0" />
                              {outlet.phone}
                            </p>
                          )}
                        </div>
                        {selectedOutletId === outlet.id && (
                          <CheckCircle size={24} className="text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={!selectedOutletId}
                onClick={() => setStep(2)}
              >
                Lanjut
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Device Name */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-1">Nama Perangkat</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Beri nama perangkat ini untuk identifikasi
              </p>

              <div className="mb-6">
                <Input
                  placeholder="contoh: Kasir 1, Meja Depan"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Nama ini akan muncul di laporan dan riwayat transaksi
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={!deviceName.trim()}
                onClick={() => setStep(3)}
              >
                Lanjut
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-1">Konfirmasi Pengaturan</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Pastikan semua informasi sudah benar
              </p>

              <div className="rounded-xl bg-muted p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outlet</span>
                  <span className="text-sm font-semibold">{selectedOutletName}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nama Perangkat</span>
                  <span className="text-sm font-semibold">{deviceName}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pengguna</span>
                  <span className="text-sm font-semibold">{user?.name ?? '-'}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                onClick={handleComplete}
              >
                Mulai Gunakan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
