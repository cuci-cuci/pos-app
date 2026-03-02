import { ArrowLeft, Storefront } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { ownerApi } from '@/services/owner-api'

interface StoreSettings {
  store_name: string
  address: string
  phone: string
  tax_rate: number
  receipt_footer: string
}

export function ManageStoreSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await ownerApi.getStoreSettings()
      const s: StoreSettings = res.data
      setStoreName(s.store_name)
      setAddress(s.address)
      setPhone(s.phone)
      setTaxRate(s.tax_rate ? String(s.tax_rate) : '')
      setReceiptFooter(s.receipt_footer)
    } catch {
      showToast('Gagal memuat pengaturan toko', 'error')
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function handleSubmit() {
    if (!storeName.trim()) {
      showToast('Nama toko wajib diisi', 'error')
      return
    }
    setSubmitting(true)
    try {
      await ownerApi.updateStoreSettings({
        store_name: storeName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        tax_rate: Number(taxRate) || 0,
        receipt_footer: receiptFooter.trim(),
      })
      showToast('Pengaturan toko berhasil disimpan', 'success')
    } catch {
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Pengaturan Toko</h1>
          <p className="text-sm text-muted-foreground">Edit informasi dan konfigurasi toko</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : error ? (
          <InlineError message="Gagal memuat pengaturan toko." onRetry={fetchSettings} />
        ) : (
          <div className="space-y-4">
            <div className="bg-card border rounded-[var(--radius)] p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Storefront size={18} weight="fill" className="text-primary" />
                Informasi Toko
              </div>

              <div>
                <label htmlFor="store-name" className="text-sm font-medium mb-1.5 block">
                  Nama Toko
                </label>
                <Input
                  id="store-name"
                  placeholder="Nama toko Anda"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="store-address" className="text-sm font-medium mb-1.5 block">
                  Alamat
                </label>
                <Input
                  id="store-address"
                  placeholder="Alamat toko"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="store-phone" className="text-sm font-medium mb-1.5 block">
                  No. Telepon
                </label>
                <Input
                  id="store-phone"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-card border rounded-[var(--radius)] p-4 space-y-4">
              <div className="text-sm font-semibold">Konfigurasi</div>

              <div>
                <label htmlFor="tax-rate" className="text-sm font-medium mb-1.5 block">
                  Tarif Pajak (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pajak akan otomatis dihitung pada setiap transaksi
                </p>
              </div>

              <div>
                <label htmlFor="receipt-footer" className="text-sm font-medium mb-1.5 block">
                  Footer Struk
                </label>
                <Input
                  id="receipt-footer"
                  placeholder="Contoh: Terima kasih atas kunjungan Anda!"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Teks yang ditampilkan di bagian bawah struk pembayaran
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
