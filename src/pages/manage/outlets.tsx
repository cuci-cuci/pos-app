import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Plus,
  Storefront,
  MapPin,
  Phone,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { EmptyState } from '@/components/shared/empty-state'
import { ownerApi } from '@/services/owner-api'
import { showToast } from '@/components/ui/toast'

interface Outlet {
  id: string
  name: string
  address: string
  phone: string
  is_active: boolean
}

export function ManageOutletsPage() {
  const router = useRouter()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.listOutlets()
      setOutlets(res.data ?? [])
    } catch {
      showToast('Gagal memuat data outlet', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOutlets()
  }, [fetchOutlets])

  function openCreate() {
    setEditingOutlet(null)
    setFormName('')
    setFormAddress('')
    setFormPhone('')
    setDialogOpen(true)
  }

  function openEdit(outlet: Outlet) {
    setEditingOutlet(outlet)
    setFormName(outlet.name)
    setFormAddress(outlet.address)
    setFormPhone(outlet.phone)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const data = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
      }
      if (editingOutlet) {
        await ownerApi.updateOutlet(editingOutlet.id, data)
      } else {
        await ownerApi.createOutlet(data)
      }
      setDialogOpen(false)
      fetchOutlets()
    } catch {
      showToast('Gagal menyimpan outlet', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/manage' })}
        >
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Outlet</h1>
          <p className="text-sm text-muted-foreground">
            Kelola outlet dan cabang
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : outlets.length === 0 ? (
          <EmptyState
            icon={<Storefront size={48} weight="fill" />}
            title="Belum Ada Outlet"
            description="Tambahkan outlet pertama Anda untuk mulai."
          />
        ) : (
          <div className="space-y-2">
            {outlets.map((outlet) => (
              <button
                key={outlet.id}
                type="button"
                onClick={() => openEdit(outlet)}
                className="w-full text-left bg-card border rounded-[var(--radius)] p-4 active:bg-muted transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{outlet.name}</p>
                    {outlet.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} weight="fill" />
                        {outlet.address}
                      </p>
                    )}
                    {outlet.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={12} weight="fill" />
                        {outlet.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      outlet.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="outlet-name" className="text-sm font-medium mb-1 block">Nama Outlet</label>
              <Input
                id="outlet-name"
                placeholder="Nama outlet"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="outlet-address" className="text-sm font-medium mb-1 block">Alamat</label>
              <Input
                id="outlet-address"
                placeholder="Alamat outlet"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="outlet-phone" className="text-sm font-medium mb-1 block">No. Telepon</label>
              <Input
                id="outlet-phone"
                placeholder="08xxxxxxxxxx"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
