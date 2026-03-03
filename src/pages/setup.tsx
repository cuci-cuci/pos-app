import {
  CheckCircle,
  Desktop,
  MapPin,
  Phone,
  Storefront,
  ClipboardText,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { db } from '@/db'
import type { Outlet } from '@/db/schema'
import { SUPPORT_EMAIL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { useDeviceStore } from '@/stores/device-store'
import { syncEngine } from '@/sync/sync-engine'

const STEPS = [
  { id: 'outlet', label: 'Pilih Outlet', icon: Storefront, desc: 'Pilih cabang untuk perangkat ini' },
  { id: 'device', label: 'Nama Perangkat', icon: Desktop, desc: 'Identifikasi perangkat kasir' },
  { id: 'confirm', label: 'Konfirmasi', icon: ClipboardText, desc: 'Periksa dan selesaikan' },
] as const

export function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [selectedOutletName, setSelectedOutletName] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [outlets, setOutlets] = useState<Outlet[]>([])

  const user = useAuthStore((s) => s.user)
  const { setDevice, completeSetup } = useDeviceStore()

  const tenantConfig = useLiveQuery(() => db.tenantConfig.toCollection().first(), [])

  const localOutlets = useLiveQuery(() => db.outlets.toArray(), [])

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
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/60 p-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header bar */}
        <motion.div
          className="bg-foreground/5 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Setup perangkat — <span className="font-semibold text-foreground">{tenantName}</span>
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="bg-card border rounded-xl overflow-hidden relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Mobile horizontal stepper */}
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) setStep(i)
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full',
                      isActive
                        ? 'bg-foreground/5 text-foreground'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-700 cursor-pointer'
                          : 'text-muted-foreground',
                    )}
                  >
                    {isDone ? (
                      <CheckCircle size={14} weight="fill" className="text-emerald-500 shrink-0" />
                    ) : (
                      <Icon size={14} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
                    )}
                    <span className="truncate">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn('h-px w-3 shrink-0', isDone ? 'bg-emerald-300' : 'bg-border')}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-1 min-h-[440px]">
            {/* Left sidebar stepper — hidden on mobile */}
            <div className="hidden md:flex w-[220px] shrink-0 bg-muted/40 border-r p-5 flex-col">
              <div className="mb-6">
                <h2 className="text-base font-bold tracking-tight">Setup Perangkat</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Siapkan perangkat untuk mulai menerima transaksi
                </p>
              </div>

              <div className="space-y-1 flex-1">
                {STEPS.map((s, i) => {
                  const Icon = s.icon
                  const isActive = i === step
                  const isDone = i < step
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (isDone) setStep(i)
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left w-full',
                        isActive
                          ? 'bg-foreground/5 text-foreground'
                          : isDone
                            ? 'text-emerald-700 cursor-pointer hover:bg-emerald-50/50'
                            : 'text-muted-foreground',
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                          isActive
                            ? 'bg-foreground/10'
                            : isDone
                              ? 'bg-emerald-100'
                              : 'bg-foreground/5',
                        )}
                      >
                        {isDone ? (
                          <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                        ) : (
                          <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                        )}
                      </div>
                      <span className="leading-tight">{s.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="pt-4 border-t border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Step {step + 1} dari {STEPS.length}
                </p>
                <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Right content area */}
            <div className="flex-1 p-6 flex flex-col">
              <AnimatePresence mode="wait">
                {/* Step 0: Outlet Selection */}
                {step === 0 && (
                  <motion.div
                    key="step-outlet"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="mb-5">
                      <h2 className="text-lg font-bold tracking-tight">Pilih Outlet</h2>
                      <p className="text-sm text-muted-foreground">
                        Perangkat ini akan terikat ke outlet yang dipilih
                      </p>
                    </div>

                    {outlets.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <Storefront
                            size={40}
                            className="mx-auto text-muted-foreground mb-3"
                            weight="fill"
                          />
                          <p className="text-sm text-muted-foreground">
                            Belum ada outlet tersedia. Silakan sinkronkan data terlebih dahulu.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto -mx-1 px-1">
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
                                : 'border-border bg-card',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                                  selectedOutletId === outlet.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                <Storefront size={20} weight="fill" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{outlet.name}</p>
                                {outlet.address && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin size={12} weight="fill" className="shrink-0" />
                                    <span className="truncate">{outlet.address}</span>
                                  </p>
                                )}
                                {outlet.phone && (
                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Phone size={12} weight="fill" className="shrink-0" />
                                    {outlet.phone}
                                  </p>
                                )}
                              </div>
                              {selectedOutletId === outlet.id && (
                                <CheckCircle
                                  size={22}
                                  weight="fill"
                                  className="text-primary shrink-0 mt-2"
                                />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Button
                        size="lg"
                        className="w-full h-11"
                        disabled={!selectedOutletId}
                        onClick={() => setStep(1)}
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Device Name */}
                {step === 1 && (
                  <motion.div
                    key="step-device"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="mb-5">
                      <h2 className="text-lg font-bold tracking-tight">Nama Perangkat</h2>
                      <p className="text-sm text-muted-foreground">
                        Beri nama perangkat ini untuk identifikasi di laporan
                      </p>
                    </div>

                    <div className="space-y-1.5 mb-6">
                      <label
                        htmlFor="deviceName"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Nama perangkat
                      </label>
                      <Input
                        id="deviceName"
                        placeholder="contoh: Kasir 1, Meja Depan"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Nama ini akan muncul di laporan dan riwayat transaksi
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 flex-1"
                        onClick={() => setStep(0)}
                      >
                        Kembali
                      </Button>
                      <Button
                        size="lg"
                        className="h-11 flex-1"
                        disabled={!deviceName.trim()}
                        onClick={() => setStep(2)}
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Confirmation */}
                {step === 2 && (
                  <motion.div
                    key="step-confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="mb-5">
                      <h2 className="text-lg font-bold tracking-tight">Konfirmasi</h2>
                      <p className="text-sm text-muted-foreground">
                        Pastikan semua informasi sudah benar sebelum memulai
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/60 border p-4 space-y-3 mb-6">
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

                    <div className="mt-auto pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 flex-1"
                        onClick={() => setStep(1)}
                      >
                        Kembali
                      </Button>
                      <Button
                        size="lg"
                        className="h-11 flex-1"
                        onClick={handleComplete}
                      >
                        Mulai Gunakan
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer bar — gray */}
        <motion.div
          className="bg-foreground/5 rounded-b-xl px-5 pt-6 pb-4 -mt-3 relative z-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground">
            Butuh bantuan? Hubungi kami di{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-foreground font-medium hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
