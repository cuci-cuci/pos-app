import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  LinkSimple,
  Package,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { formatCurrency, sanitizeCurrencyInput } from '@/lib/format'
import {
  inventoryApi,
  type LowStockAlert,
  type ServiceSupplyMapping,
  type Supply,
} from '@/services/inventory-api'
import { ownerApi } from '@/services/owner-api'

type Tab = 'supplies' | 'mappings'

// --------------- Supplies Tab ---------------

function SuppliesTab() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUnit, setFormUnit] = useState('pcs')
  const [formStock, setFormStock] = useState('')
  const [formMinStock, setFormMinStock] = useState('')
  const [formCost, setFormCost] = useState('')
  const [creating, setCreating] = useState(false)

  // Stock movement form
  const [movementSupplyId, setMovementSupplyId] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<'in' | 'out'>('in')
  const [movementQty, setMovementQty] = useState('')
  const [movementNotes, setMovementNotes] = useState('')
  const [recording, setRecording] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [suppliesRes, alertsRes] = await Promise.all([
        inventoryApi.listSupplies(),
        inventoryApi.getLowStockAlerts(),
      ])
      setSupplies(suppliesRes.data ?? [])
      setAlerts(alertsRes.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!formName.trim()) return
    setCreating(true)
    try {
      await inventoryApi.createSupply({
        name: formName.trim(),
        unit: formUnit,
        current_stock: Number(formStock) || 0,
        min_stock: Number(formMinStock) || 0,
        cost_per_unit: Number(sanitizeCurrencyInput(formCost)) || 0,
      })
      showToast('Bahan berhasil ditambahkan', 'success')
      setShowForm(false)
      setFormName('')
      setFormUnit('pcs')
      setFormStock('')
      setFormMinStock('')
      setFormCost('')
      await fetchData()
    } catch {
      showToast('Gagal menambahkan bahan', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleMovement = async () => {
    if (!movementSupplyId || !movementQty) return
    setRecording(true)
    try {
      await inventoryApi.recordMovement({
        supply_id: movementSupplyId,
        movement_type: movementType,
        quantity: Number(movementQty),
        notes: movementNotes || undefined,
      })
      showToast(movementType === 'in' ? 'Stok masuk dicatat' : 'Stok keluar dicatat', 'success')
      setMovementSupplyId(null)
      setMovementQty('')
      setMovementNotes('')
      await fetchData()
    } catch {
      showToast('Gagal mencatat pergerakan stok', 'error')
    } finally {
      setRecording(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah Bahan
        </Button>
      </div>

      {/* Low stock alerts */}
      {alerts.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-[var(--radius)] p-3">
          <div className="flex items-center gap-2 mb-2">
            <WarningCircle size={18} weight="fill" className="text-warning" />
            <span className="text-sm font-semibold text-warning">
              {alerts.length} bahan stok menipis
            </span>
          </div>
          <div className="space-y-1">
            {alerts.map((a) => (
              <div key={a.supply_id} className="flex justify-between text-xs">
                <span>{a.name}</span>
                <span className="text-warning font-medium">
                  {a.current_stock} / {a.min_stock} {a.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
          <p className="text-sm font-semibold">Tambah Bahan Baru</p>
          <Input
            placeholder="Nama bahan (mis: Deterjen Cair)"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Satuan (pcs, liter, kg)"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Stok awal"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min. stok (alert)"
              value={formMinStock}
              onChange={(e) => setFormMinStock(e.target.value)}
            />
            <Input
              placeholder="Harga per unit"
              value={formCost}
              onChange={(e) => setFormCost(sanitizeCurrencyInput(e.target.value))}
            />
          </div>
          <Button className="w-full" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      )}

      {/* Stock movement dialog */}
      {movementSupplyId && (
        <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
          <p className="text-sm font-semibold">
            Catat Stok {movementType === 'in' ? 'Masuk' : 'Keluar'}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={movementType === 'in' ? 'default' : 'outline'}
              onClick={() => setMovementType('in')}
            >
              <ArrowDown size={14} className="mr-1" /> Masuk
            </Button>
            <Button
              size="sm"
              variant={movementType === 'out' ? 'default' : 'outline'}
              onClick={() => setMovementType('out')}
            >
              <ArrowUp size={14} className="mr-1" /> Keluar
            </Button>
          </div>
          <Input
            type="number"
            placeholder="Jumlah"
            value={movementQty}
            onChange={(e) => setMovementQty(e.target.value)}
          />
          <Input
            placeholder="Catatan (opsional)"
            value={movementNotes}
            onChange={(e) => setMovementNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setMovementSupplyId(null)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={() => void handleMovement()} disabled={recording}>
              {recording ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <ManageListSkeleton />
      ) : error ? (
        <InlineError message="Gagal memuat data inventaris" onRetry={fetchData} />
      ) : supplies.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="Belum ada bahan"
          description="Tambah bahan & supplies untuk mulai tracking stok"
        />
      ) : (
        <div className="space-y-2">
          {supplies.map((s) => {
            const isLow = s.min_stock > 0 && s.current_stock <= s.min_stock
            return (
              <div key={s.id} className="bg-card border rounded-[var(--radius)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {isLow && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Low
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.current_stock} {s.unit}
                      {s.min_stock > 0 && ` (min: ${s.min_stock})`}
                      {s.cost_per_unit > 0 && ` · ${formatCurrency(s.cost_per_unit)}/${s.unit}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => {
                        setMovementSupplyId(s.id)
                        setMovementType('in')
                      }}
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={() => {
                        setMovementSupplyId(s.id)
                        setMovementType('out')
                      }}
                    >
                      <ArrowUp size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --------------- Mappings Tab ---------------

interface ServiceOption {
  id: string
  name: string
}

function MappingsTab() {
  const [mappings, setMappings] = useState<ServiceSupplyMapping[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createServiceId, setCreateServiceId] = useState('')
  const [createSupplyId, setCreateSupplyId] = useState('')
  const [createQty, setCreateQty] = useState('1')
  const [createUnit, setCreateUnit] = useState('pcs')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editMapping, setEditMapping] = useState<ServiceSupplyMapping | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editing, setEditing] = useState(false)

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [mappingsRes, suppliesRes, servicesRes] = await Promise.all([
        inventoryApi.listMappings(),
        inventoryApi.listSupplies(),
        ownerApi.listServices(),
      ])
      setMappings(mappingsRes.data ?? [])
      setSupplies(suppliesRes.data ?? [])
      // Services response: { data: { id, name, ... }[] }
      const svcData = servicesRes.data ?? []
      setServices(
        svcData.map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name,
        })),
      )
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!createServiceId || !createSupplyId || !createQty) return
    setCreating(true)
    try {
      await inventoryApi.createMapping({
        service_template_id: createServiceId,
        supply_id: createSupplyId,
        quantity_per_unit: Number(createQty),
        unit: createUnit || 'pcs',
      })
      showToast('Pemetaan berhasil ditambahkan', 'success')
      setShowCreate(false)
      setCreateServiceId('')
      setCreateSupplyId('')
      setCreateQty('1')
      setCreateUnit('pcs')
      await fetchData()
    } catch {
      showToast('Gagal menambahkan pemetaan', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editMapping || !editQty) return
    setEditing(true)
    try {
      await inventoryApi.updateMapping(editMapping.id, {
        quantity_per_unit: Number(editQty),
        unit: editUnit || 'pcs',
      })
      showToast('Pemetaan berhasil diperbarui', 'success')
      setEditMapping(null)
      await fetchData()
    } catch {
      showToast('Gagal memperbarui pemetaan', 'error')
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await inventoryApi.deleteMapping(id)
      showToast('Pemetaan berhasil dihapus', 'success')
      await fetchData()
    } catch {
      showToast('Gagal menghapus pemetaan', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah Pemetaan
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <ManageListSkeleton />
      ) : error ? (
        <InlineError message="Gagal memuat data pemetaan" onRetry={fetchData} />
      ) : mappings.length === 0 ? (
        <EmptyState
          icon={<LinkSimple size={32} />}
          title="Belum ada pemetaan"
          description="Hubungkan layanan dengan bahan yang digunakan untuk auto-deduct stok"
        />
      ) : (
        <div className="space-y-2">
          {mappings.map((m) => (
            <div key={m.id} className="bg-card border rounded-[var(--radius)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.service_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.supply_name} - {m.quantity_per_unit} {m.unit} per unit layanan
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => {
                      setEditMapping(m)
                      setEditQty(String(m.quantity_per_unit))
                      setEditUnit(m.unit)
                    }}
                  >
                    <PencilSimple size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-destructive"
                    onClick={() => void handleDelete(m.id)}
                    disabled={deleting === m.id}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pemetaan Bahan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Layanan</label>
              <select
                className="w-full h-10 rounded-[var(--radius)] border bg-background px-3 text-sm"
                value={createServiceId}
                onChange={(e) => setCreateServiceId(e.target.value)}
              >
                <option value="">Pilih layanan...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bahan</label>
              <select
                className="w-full h-10 rounded-[var(--radius)] border bg-background px-3 text-sm"
                value={createSupplyId}
                onChange={(e) => {
                  setCreateSupplyId(e.target.value)
                  // Auto-fill unit from supply
                  const supply = supplies.find((s) => s.id === e.target.value)
                  if (supply) setCreateUnit(supply.unit)
                }}
              >
                <option value="">Pilih bahan...</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Jumlah per unit</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="1.0"
                  value={createQty}
                  onChange={(e) => setCreateQty(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Satuan</label>
                <Input
                  placeholder="pcs"
                  value={createUnit}
                  onChange={(e) => setCreateUnit(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Batal
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMapping} onOpenChange={(open) => !open && setEditMapping(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pemetaan</DialogTitle>
          </DialogHeader>
          {editMapping && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {editMapping.service_name} &rarr; {editMapping.supply_name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Jumlah per unit</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Satuan</label>
                  <Input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMapping(null)}>
              Batal
            </Button>
            <Button onClick={() => void handleUpdate()} disabled={editing}>
              {editing ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --------------- Main Page ---------------

export function ManageInventoryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('supplies')

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Inventaris</h1>
          <p className="text-sm text-muted-foreground">Kelola stok bahan & pemetaan layanan</p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="px-4 pb-2 flex gap-2">
        <Button
          size="sm"
          variant={activeTab === 'supplies' ? 'default' : 'outline'}
          onClick={() => setActiveTab('supplies')}
        >
          <Package size={16} className="mr-1" />
          Stok Bahan
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'mappings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('mappings')}
        >
          <LinkSimple size={16} className="mr-1" />
          Pemetaan Bahan
        </Button>
      </div>

      <div className="px-4 pb-6">
        {activeTab === 'supplies' ? <SuppliesTab /> : <MappingsTab />}
      </div>
    </div>
  )
}
