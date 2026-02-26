import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  CurrencyDollar,
  Storefront,
  UserPlus,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ownerApi } from '@/services/owner-api'
import { useAuthStore } from '@/stores/auth-store'

const TOTAL_STEPS = 5
const STEP_IDS = ['welcome', 'pricing', 'cashier', 'payment', 'done'] as const

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
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Progress bar */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEP_IDS.map((id, i) => (
            <div
              key={id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary' : 'w-2 bg-border',
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Step {step + 1} dari {TOTAL_STEPS}
        </p>
      </div>

      <div className="flex-1 flex items-start justify-center p-4">
        <div className="w-full max-w-md">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Storefront size={48} className="text-primary" weight="fill" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Selamat datang di kelarin!</h1>
                <p className="text-muted-foreground mb-2">{user?.name}</p>
                <p className="text-sm text-muted-foreground mb-8">
                  Mari siapkan bisnis Anda sebelum mulai menggunakan POS.
                </p>
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => setStep(1)}
                >
                  Berikutnya
                  <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Service Pricing */}
          {step === 1 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -ml-2"
                    onClick={() => setStep(0)}
                  >
                    <ArrowLeft size={20} weight="bold" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold">Harga Layanan</h2>
                    <p className="text-sm text-muted-foreground">Atur harga layanan laundry Anda</p>
                  </div>
                </div>

                {servicesLoading ? (
                  <LoadingSpinner />
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
                  <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {category}
                        </p>
                        <div className="space-y-2">
                          {categoryServices.map((service) => (
                            <div
                              key={service.template_id}
                              className="flex items-center justify-between gap-3 bg-muted rounded-[var(--radius)] p-3"
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

                <div className="mt-6 space-y-2">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold"
                    onClick={handleSavePrices}
                    disabled={savingPrices}
                  >
                    {savingPrices
                      ? 'Menyimpan...'
                      : Object.keys(editingPrices).length > 0
                        ? 'Simpan & Lanjutkan'
                        : 'Lanjutkan'}
                    {!savingPrices && <ArrowRight size={18} className="ml-2" weight="bold" />}
                  </Button>
                  {Object.keys(editingPrices).length === 0 && services.length > 0 && (
                    <Button variant="ghost" className="w-full text-sm" onClick={() => setStep(2)}>
                      Gunakan harga default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Add Cashier */}
          {step === 2 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -ml-2"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft size={20} weight="bold" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold">Tambah Kasir</h2>
                    <p className="text-sm text-muted-foreground">
                      Opsional - tambahkan akun kasir pertama Anda
                    </p>
                  </div>
                </div>

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
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="onboard-cashier-name"
                        className="text-sm font-medium mb-1 block"
                      >
                        Nama
                      </label>
                      <Input
                        id="onboard-cashier-name"
                        placeholder="Nama kasir"
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="onboard-cashier-email"
                        className="text-sm font-medium mb-1 block"
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
                    <div>
                      <label
                        htmlFor="onboard-cashier-password"
                        className="text-sm font-medium mb-1 block"
                      >
                        Password
                      </label>
                      <Input
                        id="onboard-cashier-password"
                        type="password"
                        placeholder="Password kasir"
                        value={cashierPassword}
                        onChange={(e) => setCashierPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  {cashierAdded ? (
                    <Button
                      size="lg"
                      className="w-full h-12 text-base font-semibold"
                      onClick={() => setStep(3)}
                    >
                      Lanjutkan
                      <ArrowRight size={18} className="ml-2" weight="bold" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                        onClick={handleAddCashier}
                        disabled={
                          addingCashier ||
                          !cashierName.trim() ||
                          !cashierEmail.trim() ||
                          !cashierPassword
                        }
                      >
                        <UserPlus size={18} className="mr-2" weight="fill" />
                        {addingCashier ? 'Menambahkan...' : 'Tambah Kasir'}
                      </Button>
                      <Button variant="ghost" className="w-full text-sm" onClick={() => setStep(3)}>
                        Lewati
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment Methods */}
          {step === 3 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -ml-2"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft size={20} weight="bold" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold">Metode Pembayaran</h2>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan metode pembayaran yang Anda terima
                    </p>
                  </div>
                </div>

                {paymentMethodsLoading ? (
                  <LoadingSpinner />
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
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between gap-3 bg-muted rounded-[var(--radius)] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{method.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {method.type}
                            {method.description ? ` - ${method.description}` : ''}
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
                    className="w-full h-12 text-base font-semibold"
                    onClick={() => setStep(4)}
                  >
                    Selesai
                    <ArrowRight size={18} className="ml-2" weight="bold" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle size={48} className="text-emerald-500" weight="fill" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Setup bisnis Anda telah selesai!</h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Selanjutnya, siapkan perangkat dan outlet untuk mulai menerima transaksi.
                </p>
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleFinish}
                >
                  Mulai Gunakan POS
                  <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
