import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Package,
  Plus,
  WarningCircle,
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
import { sanitizeCurrencyInput } from '@/lib/format'
import {
  inventoryApi,
  type LowStockAlert,
  type Supply,
} from '@/services/inventory-api'

export function ManageInventoryPage() {
  const router = useRouter()
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
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Inventaris</h1>
          <p className="text-sm text-muted-foreground">Kelola stok bahan & supplies</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6 space-y-3">
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
                <div
                  key={s.id}
                  className="bg-card border rounded-[var(--radius)] p-3"
                >
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
    </div>
  )
}
