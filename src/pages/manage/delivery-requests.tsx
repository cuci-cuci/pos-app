import { ArrowLeft, MapTrifold, Phone, Plus, Truck } from '@phosphor-icons/react'
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
  deliveryApi,
  type DeliveryZone,
  type PickupRequest,
  type CreatePickupRequestPayload,
} from '@/services/delivery-api'
import { ownerApi } from '@/services/owner-api'

interface Outlet {
  id: string
  name: string
}

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  assigned: 'Ditugaskan',
  in_transit: 'Dalam Perjalanan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const typeLabels: Record<string, string> = {
  pickup: 'Jemput',
  delivery: 'Antar',
}

export function ManageDeliveryRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [formOutletId, setFormOutletId] = useState('')
  const [formZoneId, setFormZoneId] = useState('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerPhone, setFormCustomerPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formType, setFormType] = useState<'pickup' | 'delivery'>('pickup')
  const [formNotes, setFormNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [requestsRes, outletsRes, zonesRes] = await Promise.all([
        deliveryApi.listRequests({ status: filterStatus || undefined }),
        ownerApi.listOutlets(),
        deliveryApi.listZones(),
      ])
      setRequests(requestsRes.data ?? [])
      const outletList = outletsRes.data ?? []
      setOutlets(outletList)
      setZones(zonesRes.data ?? [])
      if (!formOutletId && outletList.length > 0) {
        setFormOutletId(outletList[0].id)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, formOutletId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!formCustomerName.trim() || !formCustomerPhone.trim() || !formAddress.trim() || !formOutletId) return
    setCreating(true)
    try {
      const data: CreatePickupRequestPayload = {
        outlet_id: formOutletId,
        zone_id: formZoneId || undefined,
        customer_name: formCustomerName.trim(),
        customer_phone: formCustomerPhone.trim(),
        address: formAddress.trim(),
        pickup_type: formType,
        notes: formNotes.trim() || undefined,
      }
      await deliveryApi.createRequest(data)
      showToast('Permintaan berhasil dibuat', 'success')
      setShowForm(false)
      setFormCustomerName('')
      setFormCustomerPhone('')
      setFormAddress('')
      setFormType('pickup')
      setFormNotes('')
      setFormZoneId('')
      await fetchData()
    } catch {
      showToast('Gagal membuat permintaan', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await deliveryApi.updateRequestStatus(id, status)
      showToast(`Status diubah ke ${statusLabels[status] ?? status}`, 'success')
      await fetchData()
    } catch {
      showToast('Gagal mengubah status', 'error')
    }
  }

  const filteredZones = zones.filter((z) => z.is_active && (!formOutletId || z.outlet_id === formOutletId))

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Jemput & Antar</h1>
          <p className="text-sm text-muted-foreground">Kelola permintaan pickup & delivery</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Buat
        </Button>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['', 'pending', 'assigned', 'in_transit', 'completed', 'cancelled'].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {s === '' ? 'Semua' : statusLabels[s] ?? s}
            </button>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
            <p className="text-sm font-semibold">Buat Permintaan Baru</p>
            {outlets.length > 1 && (
              <select
                value={formOutletId}
                onChange={(e) => {
                  setFormOutletId(e.target.value)
                  setFormZoneId('')
                }}
                className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
            <Input
              placeholder="Nama pelanggan"
              value={formCustomerName}
              onChange={(e) => setFormCustomerName(e.target.value)}
            />
            <Input
              placeholder="No. telepon"
              type="tel"
              value={formCustomerPhone}
              onChange={(e) => setFormCustomerPhone(e.target.value)}
            />
            <textarea
              placeholder="Alamat lengkap"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              {(['pickup', 'delivery'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormType(type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius)] border text-sm font-medium transition-colors ${
                    formType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
                >
                  {type === 'delivery' && <Truck size={16} weight="bold" />}
                  {typeLabels[type]}
                </button>
              ))}
            </div>
            {filteredZones.length > 0 && (
              <select
                value={formZoneId}
                onChange={(e) => setFormZoneId(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih zona (opsional)</option>
                {filteredZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} - {formatCurrency(z.fee)}
                  </option>
                ))}
              </select>
            )}
            <Input
              placeholder="Catatan (opsional)"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
            <Button className="w-full" onClick={() => void handleCreate()} disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat data" onRetry={fetchData} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Truck size={32} />}
            title="Belum ada permintaan"
            description="Buat permintaan jemput atau antar untuk pelanggan"
          />
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="bg-card border rounded-[var(--radius)] p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{req.customer_name}</p>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[req.status] ?? ''}`}
                      >
                        {statusLabels[req.status] ?? req.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {typeLabels[req.pickup_type] ?? req.pickup_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Phone size={12} />
                      <span>{req.customer_phone}</span>
                    </div>
                    <div className="flex items-start gap-2 mt-0.5 text-xs text-muted-foreground">
                      <MapTrifold size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{req.address}</span>
                    </div>
                    {req.zone_name && (
                      <span className="text-xs text-primary mt-0.5 block">
                        Zona: {req.zone_name} ({formatCurrency(req.delivery_fee)})
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {formatDate(req.created_at)}
                      {req.outlet_name && ` · ${req.outlet_name}`}
                    </span>
                  </div>
                </div>

                {/* Status actions */}
                {req.status !== 'completed' && req.status !== 'cancelled' && (
                  <div className="flex gap-1.5 flex-wrap">
                    {req.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => void handleUpdateStatus(req.id, 'assigned')}
                        >
                          Tugaskan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-destructive"
                          onClick={() => void handleUpdateStatus(req.id, 'cancelled')}
                        >
                          Batalkan
                        </Button>
                      </>
                    )}
                    {req.status === 'assigned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => void handleUpdateStatus(req.id, 'in_transit')}
                      >
                        Mulai Perjalanan
                      </Button>
                    )}
                    {req.status === 'in_transit' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => void handleUpdateStatus(req.id, 'completed')}
                      >
                        Selesai
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
