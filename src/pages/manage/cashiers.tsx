import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, Plus, UserCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { ownerApi } from '@/services/owner-api'

interface Cashier {
  id: string
  name: string
  email: string
  phone: string
  is_active: boolean
  outlet_name: string
}

export function ManageCashiersPage() {
  const router = useRouter()
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCashiers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.listCashiers()
      setCashiers(res.data ?? [])
    } catch {
      alert('Gagal memuat data kasir')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCashiers()
  }, [fetchCashiers])

  function openCreate() {
    setEditingCashier(null)
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormPassword('')
    setDialogOpen(true)
  }

  function openEdit(cashier: Cashier) {
    setEditingCashier(cashier)
    setFormName(cashier.name)
    setFormEmail(cashier.email)
    setFormPhone(cashier.phone)
    setFormPassword('')
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formName.trim() || !formEmail.trim()) return
    setSubmitting(true)
    try {
      const data: Record<string, string> = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
      }
      if (formPassword) {
        data.password = formPassword
      }
      if (editingCashier) {
        await ownerApi.updateCashier(editingCashier.id, data)
      } else {
        data.password = formPassword
        await ownerApi.createCashier(data)
      }
      setDialogOpen(false)
      fetchCashiers()
    } catch {
      alert('Gagal menyimpan data kasir')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(cashier: Cashier) {
    try {
      await ownerApi.updateCashier(cashier.id, {
        is_active: !cashier.is_active,
      })
      fetchCashiers()
    } catch {
      alert('Gagal mengubah status kasir')
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
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Kasir</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Kelola akun kasir
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <LoadingSpinner />
        ) : cashiers.length === 0 ? (
          <EmptyState
            icon={<UserCircle size={48} />}
            title="Belum Ada Kasir"
            description="Tambahkan kasir untuk membantu operasional."
          />
        ) : (
          <div className="space-y-2">
            {cashiers.map((cashier) => (
              <div
                key={cashier.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cashier)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-sm font-semibold">{cashier.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {cashier.email}
                    </p>
                    {cashier.outlet_name && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {cashier.outlet_name}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cashier)}
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                      cashier.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {cashier.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
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
              {editingCashier ? 'Edit Kasir' : 'Tambah Kasir'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="cashier-name" className="text-sm font-medium mb-1 block">Nama</label>
              <Input
                id="cashier-name"
                placeholder="Nama kasir"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cashier-email" className="text-sm font-medium mb-1 block">Email</label>
              <Input
                id="cashier-email"
                type="email"
                placeholder="email@contoh.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cashier-phone" className="text-sm font-medium mb-1 block">No. Telepon</label>
              <Input
                id="cashier-phone"
                placeholder="08xxxxxxxxxx"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="cashier-password" className="text-sm font-medium mb-1 block">
                Password{editingCashier ? ' (kosongkan jika tidak diubah)' : ''}
              </label>
              <Input
                id="cashier-password"
                type="password"
                placeholder="Password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
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
