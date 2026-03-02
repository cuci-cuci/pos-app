import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  CurrencyDollar,
  Eye,
  EyeSlash,
  Storefront,
  UserPlus,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ownerApi } from '@/services/owner-api'
import { useAuthStore } from '@/stores/auth-store'

const STEPS = [
  { id: 'welcome', label: 'Mulai', icon: Storefront },
  { id: 'pricing', label: 'Harga', icon: CurrencyDollar },
  { id: 'cashier', label: 'Kasir', icon: UserPlus },
  { id: 'payment', label: 'Bayar', icon: CreditCard },
  { id: 'done', label: 'Selesai', icon: CheckCircle },
] as const

interface Service {
  id: string
  template_id: string
  name: string
  category: string
  base_price: number
  price: number | null
  pricing_unit?: string
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  is_active: boolean
  description: string
}

export function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)
  const [step, setStep] = useState(0)

  // Step 1: Services & Pricing
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({})
  const [savingPrices, setSavingPrices] = useState(false)

  // Step 2: Cashier
  const [cashierName, setCashierName] = useState('')
  const [cashierEmail, setCashierEmail] = useState('')
  const [cashierPassword, setCashierPassword] = useState('')
  const [showCashierPassword, setShowCashierPassword] = useState(false)
  const [cashierAdded, setCashierAdded] = useState(false)
  const [addingCashier, setAddingCashier] = useState(false)

  // Step 3: Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setServicesLoading(true)
      const res = await ownerApi.listServices()
      setServices(res.data ?? [])
    } catch {
      // silently fail in onboarding context
    } finally {
      setServicesLoading(false)
    }
  }, [])

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setPaymentMethodsLoading(true)
      const res = await ownerApi.listPaymentMethods()
      setPaymentMethods(res.data ?? [])
    } catch {
      // silently fail
    } finally {
      setPaymentMethodsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (step === 1) {
      fetchServices()
    }
    if (step === 3) {
      fetchPaymentMethods()
    }
  }, [step, fetchServices, fetchPaymentMethods])

  function handlePriceChange(templateId: string, value: string) {
    setEditingPrices((prev) => ({ ...prev, [templateId]: value }))
  }

  function getDisplayPrice(service: Service): string {
    if (editingPrices[service.template_id] !== undefined) {
      return editingPrices[service.template_id]
    }
    return service.price !== null ? String(service.price) : ''
  }

  async function handleSavePrices() {
    const entries = Object.entries(editingPrices)
    if (entries.length === 0) {
      setStep(2)
      return
    }
    setSavingPrices(true)
    try {
      const prices = entries.map(([templateId, priceStr]) => ({
        template_id: templateId,
        price: Number(priceStr) || 0,
      }))
      await ownerApi.bulkSetPrices({ prices })
      setEditingPrices({})
      setStep(2)
    } catch {
      showToast('Gagal menyimpan harga', 'error')
    } finally {
      setSavingPrices(false)
    }
  }

  async function handleAddCashier() {
    if (!cashierName.trim() || !cashierEmail.trim() || !cashierPassword) return
    setAddingCashier(true)
    try {
      await ownerApi.createCashier({
        name: cashierName.trim(),
        email: cashierEmail.trim(),
        password: cashierPassword,
      })
      setCashierAdded(true)
    } catch {
      showToast('Gagal menambahkan kasir', 'error')
    } finally {
      setAddingCashier(false)
    }
  }

  async function handleTogglePaymentMethod(method: PaymentMethod) {
    setTogglingId(method.id)
    try {
      await ownerApi.updatePaymentMethod(method.id, {
        is_active: !method.is_active,
      })
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === method.id ? { ...m, is_active: !m.is_active } : m)),
      )
    } catch {
      showToast('Gagal mengubah status', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  function handleFinish() {
    setOnboardingComplete(true)
    void router.navigate({ to: '/setup' })
  }

  // Group services by category
  const servicesByCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category || 'Lainnya'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(service)
    return acc
  }, {})

  return (
    <div className="min-h-screen flex flex-col items-center bg-muted/60 p-4">
      <motion.div
        className="w-full max-w-[480px] mt-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header bar with stepper */}
        <motion.div
          className="bg-foreground/5 rounded-t-xl px-5 pt-4 pb-6 -mb-3 relative z-0"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={s.id} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isDone
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isDone ? (
                        <CheckCircle size={16} weight="fill" />
                      ) : (
                        <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted-foreground',
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-px flex-1 -mt-4',
                        isDone ? 'bg-primary/30' : 'bg-border',
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="bg-card border rounded-xl overflow-hidden relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="px-6 py-8">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Storefront size={44} className="text-primary" weight="fill" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mb-2">
                    Selamat datang, {user?.name}!
                  </h1>
                  <p className="text-sm text-muted-foreground mb-8">
                    Mari siapkan bisnis Anda sebelum mulai menggunakan POS. Proses ini hanya memakan
                    waktu beberapa menit.
                  </p>
                  <Button
                    size="lg"
                    className="h-11 px-8"
                    onClick={() => setStep(1)}
                  >
                    Mulai Setup
                    <ArrowRight size={16} weight="bold" className="ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 1: Service Pricing */}
              {step === 1 && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold tracking-tight mb-1">Harga Layanan</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Atur harga layanan laundry Anda. Anda bisa mengubahnya nanti.
                  </p>

                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-8">
                      <CurrencyDollar
                        size={48}
                        className="mx-auto text-muted-foreground mb-3"
                        weight="fill"
                      />
                      <p className="text-sm text-muted-foreground">
                        Belum ada template layanan tersedia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[45vh] overflow-y-auto -mx-1 px-1">
                      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {category}
                          </p>
                          <div className="space-y-2">
                            {categoryServices.map((service) => (
                              <div
                                key={service.template_id}
                                className="flex items-center justify-between gap-3 bg-muted/60 rounded-xl p-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {service.pricing_unit ? `per ${service.pricing_unit}` : ''}{' '}
                                    {service.base_price > 0 &&
                                      `Default: ${formatCurrency(service.base_price)}`}
                                  </p>
                                </div>
                                <Input
                                  type="number"
                                  className="w-28 h-9 text-right"
                                  placeholder="Harga"
                                  value={getDisplayPrice(service)}
                                  onChange={(e) =>
                                    handlePriceChange(service.template_id, e.target.value)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      size="lg"
                      className="h-11 px-8"
                      onClick={handleSavePrices}
                      disabled={savingPrices}
                    >
                      {savingPrices
                        ? 'Menyimpan...'
                        : Object.keys(editingPrices).length > 0
                          ? 'Simpan & Lanjutkan'
                          : 'Lanjutkan'}
                      {!savingPrices && <ArrowRight size={16} className="ml-2" weight="bold" />}
                    </Button>
                    {Object.keys(editingPrices).length === 0 && services.length > 0 && (
                      <Button variant="ghost" className="h-11 text-sm" onClick={() => setStep(2)}>
                        Gunakan harga default
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Add Cashier */}
              {step === 2 && (
                <motion.div
                  key="cashier"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold tracking-tight mb-1">Tambah Kasir</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Opsional — tambahkan akun kasir pertama Anda
                  </p>

                  {cashierAdded ? (
                    <div className="text-center py-8">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-emerald-500 mb-3"
                        weight="fill"
                      />
                      <p className="text-sm font-semibold mb-1">Kasir berhasil ditambahkan!</p>
                      <p className="text-xs text-muted-foreground">
                        {cashierName} ({cashierEmail})
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="onboard-cashier-name"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Nama kasir
                        </label>
                        <Input
                          id="onboard-cashier-name"
                          placeholder="Nama kasir"
                          value={cashierName}
                          onChange={(e) => setCashierName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="onboard-cashier-email"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Email
                        </label>
                        <Input
                          id="onboard-cashier-email"
                          type="email"
                          placeholder="email@contoh.com"
                          value={cashierEmail}
                          onChange={(e) => setCashierEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="onboard-cashier-password"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            id="onboard-cashier-password"
                            type={showCashierPassword ? 'text' : 'password'}
                            placeholder="Password kasir"
                            className="pr-10"
                            value={cashierPassword}
                            onChange={(e) => setCashierPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCashierPassword(!showCashierPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showCashierPassword ? (
                              <EyeSlash size={18} weight="bold" />
                            ) : (
                              <Eye size={18} weight="bold" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-3">
                    {cashierAdded ? (
                      <Button
                        size="lg"
                        className="h-11 px-8"
                        onClick={() => setStep(3)}
                      >
                        Lanjutkan
                        <ArrowRight size={16} className="ml-2" weight="bold" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className="h-11 px-8"
                          onClick={handleAddCashier}
                          disabled={
                            addingCashier ||
                            !cashierName.trim() ||
                            !cashierEmail.trim() ||
                            !cashierPassword
                          }
                        >
                          <UserPlus size={16} className="mr-2" weight="fill" />
                          {addingCashier ? 'Menambahkan...' : 'Tambah Kasir'}
                        </Button>
                        <Button variant="ghost" className="h-11 text-sm" onClick={() => setStep(3)}>
                          Lewati
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Methods */}
              {step === 3 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold tracking-tight mb-1">Metode Pembayaran</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Aktifkan metode pembayaran yang Anda terima
                  </p>

                  {paymentMethodsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard
                        size={48}
                        className="mx-auto text-muted-foreground mb-3"
                        weight="fill"
                      />
                      <p className="text-sm text-muted-foreground">
                        Belum ada metode pembayaran tersedia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[45vh] overflow-y-auto -mx-1 px-1">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between gap-3 bg-muted/60 rounded-xl p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{method.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {method.type}
                              {method.description ? ` — ${method.description}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={togglingId === method.id}
                            onClick={() => handleTogglePaymentMethod(method)}
                            className={cn(
                              'relative shrink-0 w-11 h-6 rounded-full transition-colors',
                              method.is_active ? 'bg-primary' : 'bg-border',
                              togglingId === method.id && 'opacity-50',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                                method.is_active && 'translate-x-5',
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6">
                    <Button
                      size="lg"
                      className="h-11 px-8"
                      onClick={() => setStep(4)}
                    >
                      Lanjutkan
                      <ArrowRight size={16} className="ml-2" weight="bold" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Done */}
              {step === 4 && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle size={44} className="text-emerald-500" weight="fill" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight mb-2">
                    Setup bisnis Anda selesai!
                  </h1>
                  <p className="text-sm text-muted-foreground mb-8">
                    Selanjutnya, siapkan perangkat dan outlet untuk mulai menerima transaksi.
                  </p>
                  <Button
                    size="lg"
                    className="h-11 px-8"
                    onClick={handleFinish}
                  >
                    Mulai Gunakan POS
                    <ArrowRight size={16} className="ml-2" weight="bold" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer bar */}
        <motion.div
          className="bg-primary rounded-b-xl px-5 pt-6 pb-4 -mt-3 relative z-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="text-sm text-primary-foreground/80">
            Butuh bantuan? Hubungi kami di{' '}
            <a
              href="mailto:help@kelarin.co.id"
              className="text-primary-foreground font-medium hover:underline"
            >
              help@kelarin.co.id
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
