import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, Tag, FloppyDisk } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/format'
import { ownerApi } from '@/services/owner-api'
import { showToast } from '@/components/ui/toast'

interface Service {
  id: string
  template_id: string
  name: string
  category: string
  base_price: number
  price: number | null
}

export function ManagePricingPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.listServices()
      setServices(res.data ?? [])
    } catch {
      showToast('Gagal memuat data layanan', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  function handlePriceChange(templateId: string, value: string) {
    setEditingPrices((prev) => ({ ...prev, [templateId]: value }))
  }

  function getDisplayPrice(service: Service): string {
    if (editingPrices[service.template_id] !== undefined) {
      return editingPrices[service.template_id]
    }
    return service.price !== null ? String(service.price) : ''
  }

  async function handleSaveAll() {
    const entries = Object.entries(editingPrices)
    if (entries.length === 0) return

    setSaving(true)
    try {
      const prices = entries.map(([templateId, priceStr]) => ({
        template_id: templateId,
        price: Number(priceStr) || 0,
      }))
      await ownerApi.bulkSetPrices({ prices })
      setEditingPrices({})
      fetchServices()
      showToast('Harga berhasil disimpan', 'success')
    } catch {
      showToast('Gagal menyimpan harga', 'error')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(editingPrices).length > 0

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
          <h1 className="text-xl font-bold">Harga Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Atur harga layanan laundry
          </p>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            <FloppyDisk size={16} weight="fill" className="mr-1" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Tag size={48} weight="fill" />}
            title="Belum Ada Layanan"
            description="Belum ada template layanan yang tersedia."
          />
        ) : (
          <div className="bg-card border rounded-[var(--radius)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Layanan
                    </th>
                    <th className="text-left p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Kategori
                    </th>
                    <th className="text-right p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Harga Dasar
                    </th>
                    <th className="text-right p-3 font-semibold text-xs text-muted-foreground uppercase">
                      Harga Anda
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr
                      key={service.template_id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="p-3 font-medium">{service.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {service.category}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {formatCurrency(service.base_price)}
                      </td>
                      <td className="p-3 text-right">
                        <Input
                          type="number"
                          className="w-28 h-8 text-right ml-auto"
                          placeholder="Harga"
                          value={getDisplayPrice(service)}
                          onChange={(e) =>
                            handlePriceChange(
                              service.template_id,
                              e.target.value,
                            )
                          }
                        />
                      </td>
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
