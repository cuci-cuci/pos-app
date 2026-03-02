import { ArrowLeft, CreditCard, Plus, Trash } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
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
import { ownerApi } from '@/services/owner-api'

interface PaymentMethod {
  id: string
  name: string
  type: string
  is_active: boolean
  description: string
}

export function ManagePaymentMethodsPage() {
  const router = useRouter()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null)

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await ownerApi.listPaymentMethods()
      setMethods(res.data ?? [])
    } catch {
      showToast('Gagal memuat data metode pembayaran', 'error')
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  function openCreate() {
    setEditingMethod(null)
    setFormName('')
    setFormType('cash')
    setFormDescription('')
    setDialogOpen(true)
  }

  function openEdit(method: PaymentMethod) {
    setEditingMethod(method)
    setFormName(method.name)
    setFormType(method.type)
    setFormDescription(method.description)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const data = {
        name: formName.trim(),
        type: formType,
        description: formDescription.trim(),
      }
      if (editingMethod) {
        await ownerApi.updatePaymentMethod(editingMethod.id, data)
      } else {
        await ownerApi.createPaymentMethod(data)
      }
      setDialogOpen(false)
      fetchMethods()
    } catch {
      showToast('Gagal menyimpan metode pembayaran', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(method: PaymentMethod) {
    try {
      await ownerApi.updatePaymentMethod(method.id, {
        is_active: !method.is_active,
      })
      fetchMethods()
    } catch {
      showToast('Gagal mengubah status', 'error')
    }
  }

  async function handleDelete() {
    if (!deletingMethod) return
    try {
      await ownerApi.deletePaymentMethod(deletingMethod.id)
      setDeletingMethod(null)
      fetchMethods()
    } catch {
      showToast('Gagal menghapus metode pembayaran', 'error')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Metode Pembayaran</h1>
          <p className="text-sm text-muted-foreground">Atur metode pembayaran</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} weight="bold" className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat metode pembayaran." onRetry={fetchMethods} />
        ) : methods.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={48} weight="fill" />}
            title="Belum Ada Metode Pembayaran"
            description="Tambahkan metode pembayaran untuk digunakan di kasir."
          />
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <div key={method.id} className="bg-card border rounded-[var(--radius)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(method)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-sm font-semibold">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.type}</p>
                    {method.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(method)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                        method.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {method.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingMethod(method)}
                    >
                      <Trash size={16} weight="fill" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="pm-name" className="text-sm font-medium mb-1 block">
                Nama
              </label>
              <Input
                id="pm-name"
                placeholder="Contoh: Transfer BCA"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pm-type" className="text-sm font-medium mb-1 block">
                Tipe
              </label>
              <select
                id="pm-type"
                className="flex h-11 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="cash">Tunai</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
            <div>
              <label htmlFor="pm-description" className="text-sm font-medium mb-1 block">
                Keterangan
              </label>
              <Input
                id="pm-description"
                placeholder="Keterangan tambahan"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingMethod} onOpenChange={() => setDeletingMethod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Metode Pembayaran</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hapus metode pembayaran &ldquo;{deletingMethod?.name}&rdquo;?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMethod(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
