import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import type { Customer } from '@/db/schema'
import { useCartStore, type MemberTier } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { memberApi } from '@/services/member-api'
import { formatCurrency } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { showToast } from '@/components/ui/toast'
import {
  CircleUser,
  X,
  Search,
  UserPlus,
  Crown,
  Tag,
  CircleDollarSign,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TIER_CONFIG: Record<MemberTier, { label: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-100' },
  silver: { label: 'Silver', color: 'text-gray-600', bg: 'bg-gray-100' },
  gold: { label: 'Gold', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  platinum: { label: 'Platinum', color: 'text-purple-700', bg: 'bg-purple-100' },
}

export function CustomerSearch() {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isSearchingApi, setIsSearchingApi] = useState(false)
  const [apiResults, setApiResults] = useState<
    Array<{
      id: string
      name: string
      phone: string
      email?: string
      tier: MemberTier
      totalSpending: number
      discountPercent: number
    }>
  >([])

  // Registration dialog state
  const [registerOpen, setRegisterOpen] = useState(false)
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const { customerId, customerName, memberInfo, setMember, setCustomer } =
    useCartStore()

  const customers = useLiveQuery(
    () => {
      if (!tenantId || query.length < 2) return [] as Customer[]
      const q = query.toLowerCase()
      return db.customers
        .where('tenantId')
        .equals(tenantId)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q)
        )
        .limit(10)
        .toArray()
    },
    [tenantId, query]
  )

  const handleSearchApi = useCallback(
    async (phone: string) => {
      if (phone.length < 4) return
      setIsSearchingApi(true)
      try {
        const response = await memberApi.search(phone)
        setApiResults(
          response.data.map((m) => ({
            id: m.id,
            name: m.name,
            phone: m.phone,
            email: m.email,
            tier: m.tier,
            totalSpending: m.total_spending,
            discountPercent: m.discount_percent,
          }))
        )
      } catch {
        // API unavailable, fall back to offline data only
        setApiResults([])
      } finally {
        setIsSearchingApi(false)
      }
    },
    []
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      setShowResults(true)
      // Try API search when we have enough digits (phone search)
      if (/^\d{4,}$/.test(value.trim())) {
        void handleSearchApi(value.trim())
      } else {
        setApiResults([])
      }
    },
    [handleSearchApi]
  )

  const handleSelectMember = useCallback(
    (member: {
      id: string
      name: string
      phone: string
      email?: string
      tier: MemberTier
      totalSpending: number
      discountPercent: number
    }) => {
      setMember({
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        tier: member.tier,
        totalSpending: member.totalSpending,
        discountPercent: member.discountPercent,
      })
      setQuery('')
      setShowResults(false)
      setApiResults([])
    },
    [setMember]
  )

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      if (customer.isMember && customer.tier) {
        setMember({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || undefined,
          tier: customer.tier,
          totalSpending: customer.totalSpending ?? 0,
          discountPercent: customer.discountPercent ?? 0,
        })
      } else {
        setCustomer(customer.id, customer.name)
      }
      setQuery('')
      setShowResults(false)
      setApiResults([])
    },
    [setMember, setCustomer]
  )

  const handleClear = useCallback(() => {
    setMember(null)
    setQuery('')
    setApiResults([])
  }, [setMember])

  const handleOpenRegister = useCallback(() => {
    setRegName('')
    setRegPhone(query.trim())
    setRegEmail('')
    setRegisterOpen(true)
    setShowResults(false)
  }, [query])

  const handleRegister = useCallback(async () => {
    if (!regName.trim() || !regPhone.trim()) return
    setIsRegistering(true)
    try {
      const response = await memberApi.register({
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
      })
      const m = response.data
      setMember({
        id: m.id,
        name: m.name,
        phone: m.phone,
        email: m.email,
        tier: m.tier,
        totalSpending: m.total_spending,
        discountPercent: m.discount_percent,
      })
      setRegisterOpen(false)
      setQuery('')
      showToast('Member berhasil didaftarkan!', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Gagal mendaftarkan member',
        'error'
      )
    } finally {
      setIsRegistering(false)
    }
  }, [regName, regPhone, regEmail, setMember])

  // Show selected member info
  if (customerId && memberInfo) {
    const tierConfig = TIER_CONFIG[memberInfo.tier]
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 bg-accent rounded-[var(--radius)] px-3 py-3">
          <CircleUser size={28} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{memberInfo.name}</span>
              <Badge
                className={cn(
                  'text-[10px] px-2 py-0 border-0',
                  tierConfig.bg,
                  tierConfig.color
                )}
              >
                <Crown size={10} className="mr-0.5" />
                {tierConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {memberInfo.phone}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CircleDollarSign size={12} />
                {formatCurrency(memberInfo.totalSpending)}
              </span>
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Tag size={12} />
                Diskon {memberInfo.discountPercent}%
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded hover:bg-background shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Show selected non-member customer
  if (customerId) {
    return (
      <div className="flex items-center gap-2 bg-accent rounded-[var(--radius)] px-3 py-2">
        <CircleUser size={20} className="text-primary" />
        <span className="text-sm font-medium flex-1">{customerName}</span>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded hover:bg-background"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  // Merge offline and API results, deduplicate by id
  const mergedResults: Array<{
    id: string
    name: string
    phone: string
    email?: string
    tier?: MemberTier
    totalSpending?: number
    discountPercent?: number
    isMember: boolean
  }> = []

  const seenIds = new Set<string>()

  // API results first (they have member data)
  for (const r of apiResults) {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id)
      mergedResults.push({
        ...r,
        isMember: true,
      })
    }
  }

  // Then offline customers
  if (customers) {
    for (const c of customers) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id)
        mergedResults.push({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || undefined,
          tier: c.tier,
          totalSpending: c.totalSpending,
          discountPercent: c.discountPercent,
          isMember: c.isMember ?? false,
        })
      }
    }
  }

  return (
    <>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Cari member (nama/telepon)..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="h-10 pl-9"
            />
            {isSearchingApi && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
              />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0 gap-1 text-xs"
            onClick={handleOpenRegister}
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Daftar Member</span>
          </Button>
        </div>

        {showResults && mergedResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-[var(--radius)] shadow-lg z-20 max-h-64 overflow-y-auto">
            {mergedResults.map((result) => {
              const tierConfig = result.tier
                ? TIER_CONFIG[result.tier]
                : null
              return (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => {
                    if (result.isMember && result.tier) {
                      handleSelectMember({
                        id: result.id,
                        name: result.name,
                        phone: result.phone,
                        email: result.email,
                        tier: result.tier,
                        totalSpending: result.totalSpending ?? 0,
                        discountPercent: result.discountPercent ?? 0,
                      })
                    } else {
                      handleSelectCustomer({
                        id: result.id,
                        tenantId: tenantId ?? '',
                        name: result.name,
                        phone: result.phone,
                        email: result.email ?? '',
                        address: '',
                        createdAt: '',
                        updatedAt: '',
                      })
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                    'hover:bg-accent active:bg-accent transition-colors',
                    'min-h-[44px]'
                  )}
                >
                  <CircleUser
                    size={24}
                    className={cn(
                      'shrink-0',
                      result.isMember
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    weight={result.isMember ? 'fill' : 'regular'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">
                        {result.name}
                      </p>
                      {tierConfig && (
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-1.5 py-0 rounded-full',
                            tierConfig.bg,
                            tierConfig.color
                          )}
                        >
                          {tierConfig.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {result.phone}
                    </p>
                    {result.isMember && result.discountPercent !== undefined && result.discountPercent > 0 && (
                      <p className="text-xs text-primary font-medium mt-0.5">
                        Diskon {result.discountPercent}%
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showResults &&
          mergedResults.length === 0 &&
          query.length >= 2 &&
          !isSearchingApi && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-[var(--radius)] shadow-lg z-20 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Tidak ditemukan
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleOpenRegister}
              >
                <UserPlus size={14} />
                Daftar Member Baru
              </Button>
            </div>
          )}
      </div>

      {/* Registration dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftar Member Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <label htmlFor="reg-name" className="text-sm font-medium mb-1 block">
                Nama
              </label>
              <Input
                id="reg-name"
                placeholder="Nama lengkap"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="text-sm font-medium mb-1 block">
                No. Telepon
              </label>
              <Input
                id="reg-phone"
                placeholder="08xxxxxxxxxx"
                type="tel"
                inputMode="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="text-sm font-medium mb-1 block">
                Email{' '}
                <span className="text-muted-foreground font-normal">
                  (opsional)
                </span>
              </label>
              <Input
                id="reg-email"
                placeholder="email@contoh.com"
                type="email"
                inputMode="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <Separator className="my-3" />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterOpen(false)}
              disabled={isRegistering}
            >
              Batal
            </Button>
            <Button
              onClick={() => void handleRegister()}
              disabled={
                !regName.trim() || !regPhone.trim() || isRegistering
              }
            >
              {isRegistering ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  Mendaftar...
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-1" />
                  Daftar Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
