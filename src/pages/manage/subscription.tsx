import { ArrowLeft, CrownSimple, Lightning, Warning } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/format'
import { ownerApi } from '@/services/owner-api'

interface SubscriptionInfo {
  plan: {
    name: string
    slug: string
    price_monthly: number
    max_outlets: number
    max_transactions_per_month: number
  }
  subscription: {
    status: string
    current_period_end: string
  } | null
  is_within_limits: boolean
  transaction_limit: number
  transactions_used: number
  outlet_limit: number
  outlets_used: number
}

export function ManageSubscriptionPage() {
  const router = useRouter()
  const [info, setInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.getSubscription()
      setInfo(res.data ?? res)
    } catch {
      showToast('Gagal memuat data langganan', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Langganan</h1>
          <p className="text-sm text-muted-foreground">Paket dan penggunaan</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : !info ? (
          <InlineError message="Gagal memuat data langganan." onRetry={fetch} />
        ) : (
          <div className="space-y-4">
            {/* Current plan */}
            <div className="bg-card border rounded-[var(--radius)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CrownSimple size={24} weight="fill" className="text-amber-500" />
                  <div>
                    <h2 className="font-bold text-lg">{info.plan.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {info.plan.price_monthly === 0
                        ? 'Gratis selamanya'
                        : `${formatCurrency(info.plan.price_monthly)}/bulan`}
                    </p>
                  </div>
                </div>
                <Badge variant={info.subscription?.status === 'active' ? 'success' : 'secondary'}>
                  {info.subscription?.status === 'active' ? 'Aktif' : 'Gratis'}
                </Badge>
              </div>
            </div>

            {/* Usage */}
            <div className="bg-card border rounded-[var(--radius)] p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Penggunaan Bulan Ini</h3>

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>Transaksi</span>
                  <span className="font-medium">
                    {info.transactions_used}
                    {info.transaction_limit > 0 ? ` / ${info.transaction_limit}` : ' / ∞'}
                  </span>
                </div>
                {info.transaction_limit > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        info.transactions_used >= info.transaction_limit
                          ? 'bg-destructive'
                          : info.transactions_used >= info.transaction_limit * 0.8
                            ? 'bg-amber-500'
                            : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(100, (info.transactions_used / info.transaction_limit) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Outlets */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>Outlet</span>
                  <span className="font-medium">
                    {info.outlets_used}
                    {info.outlet_limit > 0 ? ` / ${info.outlet_limit}` : ' / ∞'}
                  </span>
                </div>
                {info.outlet_limit > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        info.outlets_used >= info.outlet_limit ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(100, (info.outlets_used / info.outlet_limit) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Limit warning */}
            {!info.is_within_limits && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] p-4 flex items-start gap-3">
                <Warning size={20} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Batas tercapai</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade paket untuk melanjutkan membuat transaksi.
                  </p>
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {info.plan.slug === 'free' && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-[var(--radius)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightning size={20} weight="fill" className="text-primary" />
                  <h3 className="font-semibold">Upgrade ke Basic</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Transaksi unlimited, 2 outlet, analitik lengkap — mulai {formatCurrency(99000)}
                  /bulan
                </p>
                <Button className="w-full" disabled>
                  Segera Hadir
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
