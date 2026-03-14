import {
  ArrowLeft,
  CurrencyCircleDollar,
  Link as LinkIcon,
  Package,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/format'
import {
  inventoryApi,
  type ServiceCost,
  type ServiceSupplyMapping,
  type Supply,
} from '@/services/inventory-api'
import { ownerApi } from '@/services/owner-api'

interface ServiceOption {
  id: string
  name: string
  category_name?: string
}

export function ManageServiceSuppliesPage() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceOption[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [mappings, setMappings] = useState<ServiceSupplyMapping[]>([])
  const [costs, setCosts] = useState<ServiceCost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Filter by service
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [formServiceId, setFormServiceId] = useState('')
  const [formSupplyId, setFormSupplyId] = useState('')
  const [formQty, setFormQty] = useState('')
  const [formUnit, setFormUnit] = useState('pcs')
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [servicesRes, suppliesRes, mappingsRes, costsRes] = await Promise.all([
        ownerApi.listServices(),
        inventoryApi.listSupplies(),
        inventoryApi.listMappings(selectedServiceId ?? undefined),
        inventoryApi.getServiceCosts(),
      ])
      const svcData = (servicesRes.data ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        name: s.name as string,
        category_name: (s.category_name as string) ?? '',
      }))
      setServices(svcData)
      setSupplies(suppliesRes.data ?? [])
      setMappings(mappingsRes.data ?? [])
      setCosts(costsRes.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedServiceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!formServiceId || !formSupplyId || !formQty) return
    setCreating(true)
    try {
      await inventoryApi.createMapping({
        service_template_id: formServiceId,
        supply_id: formSupplyId,
        quantity_per_unit: Number(formQty),
        unit: formUnit,
      })
      showToast('Mapping berhasil ditambahkan', 'success')
      setShowForm(false)
      setFormServiceId('')
      setFormSupplyId('')
      setFormQty('')
      setFormUnit('pcs')
      await fetchData()
    } catch {
      showToast('Gagal menambahkan mapping', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await inventoryApi.deleteMapping(id)
      showToast('Mapping berhasil dihapus', 'success')
      await fetchData()
    } catch {
      showToast('Gagal menghapus mapping', 'error')
    }
  }

  const getCostForService = (serviceId: string): number => {
    const cost = costs.find((c) => c.service_template_id === serviceId)
    return cost?.total_cost_per_unit ?? 0
  }

  // Group mappings by service
  const groupedMappings = mappings.reduce(
    (acc, m) => {
      const key = m.service_template_id
      if (!acc[key]) acc[key] = { serviceName: m.service_name, items: [] }
      acc[key].items.push(m)
      return acc
    },
    {} as Record<string, { serviceName: string; items: ServiceSupplyMapping[] }>,
  )

  // Find supply unit for pre-fill
  const selectedSupply = supplies.find((s) => s.id === formSupplyId)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Pemetaan Bahan Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Atur bahan yang digunakan setiap layanan
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Filter by service */}
        {!loading && services.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={selectedServiceId === null ? 'default' : 'outline'}
              onClick={() => setSelectedServiceId(null)}
              className="shrink-0"
            >
              Semua
            </Button>
            {services.map((svc) => (
              <Button
                key={svc.id}
                size="sm"
                variant={selectedServiceId === svc.id ? 'default' : 'outline'}
                onClick={() => setSelectedServiceId(svc.id)}
                className="shrink-0"
              >
                {svc.name}
              </Button>
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
            <p className="text-sm font-semibold">Tambah Mapping Bahan</p>
            <div>
              <label className="text-xs text-muted-foreground">Layanan</label>
              <select
                className="w-full h-10 rounded-[var(--radius)] border border-input bg-background px-3 text-sm"
                value={formServiceId}
                onChange={(e) => setFormServiceId(e.target.value)}
              >
                <option value="">-- Pilih layanan --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bahan</label>
              <select
                className="w-full h-10 rounded-[var(--radius)] border border-input bg-background px-3 text-sm"
                value={formSupplyId}
                onChange={(e) => {
                  setFormSupplyId(e.target.value)
                  const sup = supplies.find((s) => s.id === e.target.value)
                  if (sup) setFormUnit(sup.unit)
                }}
              >
                <option value="">-- Pilih bahan --</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                    {s.cost_per_unit > 0 ? ` - ${formatCurrency(s.cost_per_unit)}/${s.unit}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Jumlah per unit layanan</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Contoh: 0.5"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Satuan</label>
                <Input
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="pcs, ml, gram"
                />
              </div>
            </div>
            {selectedSupply && formQty && (
              <p className="text-xs text-muted-foreground">
                Estimasi biaya per unit layanan:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(Math.round(selectedSupply.cost_per_unit * Number(formQty)))}
                </span>
              </p>
            )}
            <Button className="w-full" onClick={() => void handleCreate()} disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat data pemetaan bahan" onRetry={fetchData} />
        ) : Object.keys(groupedMappings).length === 0 ? (
          <EmptyState
            icon={<LinkIcon size={32} />}
            title="Belum ada pemetaan"
            description="Tambahkan bahan yang digunakan oleh setiap layanan untuk auto-deduct stok"
            action={{
              label: 'Tambah Mapping',
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMappings).map(([serviceId, group]) => {
              const cost = getCostForService(serviceId)
              return (
                <div key={serviceId} className="bg-card border rounded-[var(--radius)] overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{group.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length} bahan terhubung
                      </p>
                    </div>
                    {cost > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <CurrencyCircleDollar size={14} weight="fill" />
                        {formatCurrency(cost)}/unit
                      </Badge>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {group.items.map((m) => (
                      <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Package size={16} className="shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{m.supply_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.quantity_per_unit} {m.unit} / unit layanan
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => void handleDelete(m.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Cost summary */}
        {!loading && costs.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-2">Biaya Bahan per Layanan</h2>
            <div className="bg-card border rounded-[var(--radius)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Layanan
                    </th>
                    <th className="text-right p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Biaya Bahan
                    </th>
                    <th className="text-center p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Bahan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((c) => (
                    <tr key={c.service_template_id} className="border-b border-border last:border-b-0">
                      <td className="p-3 font-medium">{c.service_name}</td>
                      <td className="p-3 text-right">{formatCurrency(c.total_cost_per_unit)}</td>
                      <td className="p-3 text-center text-muted-foreground">{c.mapping_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
