import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  Phone,
} from 'lucide-react'
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

interface Member {
  id: string
  name: string
  phone: string
  email: string
  points: number
  is_active: boolean
}

export function ManageMembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.listMembers()
      setMembers(res.data ?? [])
    } catch {
      alert('Gagal memuat data member')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditingMember(null)
    setFormName('')
    setFormPhone('')
    setFormEmail('')
    setDialogOpen(true)
  }

  function openEdit(member: Member) {
    setEditingMember(member)
    setFormName(member.name)
    setFormPhone(member.phone)
    setFormEmail(member.email)
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const data = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
      }
      if (editingMember) {
        await ownerApi.updateMember(editingMember.id, data)
      } else {
        await ownerApi.createMember(data)
      }
      setDialogOpen(false)
      fetchMembers()
    } catch {
      alert('Gagal menyimpan data member')
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
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Member</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data pelanggan member
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />
          Tambah
        </Button>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            placeholder="Cari member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <LoadingSpinner />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title={search ? 'Tidak Ditemukan' : 'Belum Ada Member'}
            description={
              search
                ? 'Coba gunakan kata kunci lain.'
                : 'Tambahkan member untuk program loyalitas.'
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => openEdit(member)}
                className="w-full text-left bg-card border rounded-[var(--radius)] p-4 active:bg-muted transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{member.name}</p>
                    {member.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone size={12} />
                        {member.phone}
                      </p>
                    )}
                    {member.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {member.email}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {member.points} poin
                    </span>
                  </div>
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
              {editingMember ? 'Edit Member' : 'Tambah Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="member-name" className="text-sm font-medium mb-1 block">Nama</label>
              <Input
                id="member-name"
                placeholder="Nama member"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="member-phone" className="text-sm font-medium mb-1 block">No. Telepon</label>
              <Input
                id="member-phone"
                placeholder="08xxxxxxxxxx"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="member-email" className="text-sm font-medium mb-1 block">Email</label>
              <Input
                id="member-email"
                type="email"
                placeholder="email@contoh.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
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
