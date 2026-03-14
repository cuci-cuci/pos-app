import { ArrowLeft, MapPin, Plus, Timer, Pencil } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency, sanitizeCurrencyInput, parseCurrencyInput } from '@/lib/format'
import {
  deliveryApi,
  type DeliveryZone,
  type CreateDeliveryZoneRequest,
} from '@/services/delivery-api'
import { ownerApi } from '@/services/owner-api'

interface Outlet {
  id: string
  name: string
}

export function ManageDeliveryZonesPage() {
  const router = useRouter()
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDistrict, setFormDistrict] = useState('')
  const [formFee, setFormFee] = useState('')
  const [formMinutes, setFormMinutes] = useState('60')
  const [formOutletId, setFormOutletId] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [editFee, setEditFee] = useState('')
  const [editMinutes, setEditMinutes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [zonesRes, outletsRes] = await Promise.all([
        deliveryApi.listZones(selectedOutletId || undefined),
        ownerApi.listOutlets(),
      ])
      setZones(zonesRes.data ?? [])
      const outletList = outletsRes.data ?? []
      setOutlets(outletList)
      if (!formOutletId && outletList.length > 0) {
        setFormOutletId(outletList[0].id)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedOutletId, formOutletId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!formName.trim() || !formOutletId) return
    setCreating(true)
    try {
      const data: CreateDeliveryZoneRequest = {
        outlet_id: formOutletId,
        name: formName.trim(),
        district: formDistrict.trim() || undefined,
        fee: parseCurrencyInput(sanitizeCurrencyInput(formFee)) || 0,
        estimated_minutes: Number(formMinutes) || 60,
      }
      await deliveryApi.createZone(data)
      showToast('Zona berhasil ditambahkan', 'success')
      setShowForm(false)
      setFormName('')
      setFormDistrict('')
      setFormFee('')
      setFormMinutes('60')
      await fetchData()
    } catch {
      showToast('Gagal menambahkan zona', 'error')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id)
    setEditName(zone.name)
    setEditDistrict(zone.district ?? '')
    setEditFee(zone.fee.toString())
    setEditMinutes(zone.estimated_minutes.toString())
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    setSaving(true)
    try {
      await deliveryApi.updateZone(editingId, {
        name: editName.trim(),
        district: editDistrict.trim() || undefined,
        fee: parseCurrencyInput(sanitizeCurrencyInput(editFee)) || 0,
        estimated_minutes: Number(editMinutes) || 60,
      })
      showToast('Zona berhasil diperbarui', 'success')
      setEditingId(null)
      await fetchData()
    } catch {
      showToast('Gagal memperbarui zona', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      await deliveryApi.updateZone(zone.id, { is_active: !zone.is_active })
      showToast(zone.is_active ? 'Zona dinonaktifkan' : 'Zona diaktifkan', 'success')
      await fetchData()
    } catch {
      showToast('Gagal mengubah status zona', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Zona Pengiriman</h1>
          <p className="text-sm text-muted-foreground">Kelola zona dan tarif ongkir</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Outlet filter */}
        {outlets.length > 1 && (
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Semua Outlet</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
            <p className="text-sm font-semibold">Tambah Zona Baru</p>
            {outlets.length > 1 && (
              <select
                value={formOutletId}
                onChange={(e) => setFormOutletId(e.target.value)}
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
              placeholder="Nama zona (mis: Kec. Kebayoran Baru)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <Input
              placeholder="Kecamatan/area (opsional)"
              value={formDistrict}
              onChange={(e) => setFormDistrict(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Ongkos kirim"
                value={formFee}
                onChange={(e) => setFormFee(sanitizeCurrencyInput(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Estimasi (menit)"
                value={formMinutes}
                onChange={(e) => setFormMinutes(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => void handleCreate()} disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat data zona" onRetry={fetchData} />
        ) : zones.length === 0 ? (
          <EmptyState
            icon={<MapPin size={32} />}
            title="Belum ada zona"
            description="Tambah zona pengiriman untuk mengatur tarif ongkir otomatis"
          />
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="bg-card border rounded-[var(--radius)] p-3"
              >
                {editingId === zone.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama zona"
                    />
                    <Input
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="Kecamatan/area"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editFee}
                        onChange={(e) => setEditFee(sanitizeCurrencyInput(e.target.value))}
                        placeholder="Ongkos kirim"
                      />
                      <Input
                        type="number"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        placeholder="Estimasi (menit)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setEditingId(null)}>
                        Batal
                      </Button>
                      <Button className="flex-1" onClick={() => void handleSaveEdit()} disabled={saving}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{zone.name}</p>
                        {!zone.is_active && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {zone.district && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {zone.district}
                          </span>
                        )}
                        <span className="font-medium text-foreground">
                          {formatCurrency(zone.fee)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer size={12} /> {zone.estimated_minutes} mnt
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => startEdit(zone)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant={zone.is_active ? 'outline' : 'default'}
                        className="h-8 px-2 text-xs"
                        onClick={() => void handleToggleActive(zone)}
                      >
                        {zone.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
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
