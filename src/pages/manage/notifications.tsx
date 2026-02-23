import { ArrowLeft, ChartBar, WhatsappLogo } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import { ownerApi } from '@/services/owner-api'

interface NotificationSettings {
  whatsapp_enabled: boolean
  fonnte_api_token: string | null
  notify_on_received: boolean
  notify_on_done: boolean
  notify_on_picked_up: boolean
  daily_summary_enabled: boolean
  daily_summary_time: string
  owner_phone: string | null
}

export function ManageNotificationsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [token, setToken] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [summaryTime, setSummaryTime] = useState('20:00')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ownerApi.getNotificationSettings()
      const data = res.data ?? res
      setSettings(data)
      setToken(data.fonnte_api_token ?? '')
      setOwnerPhone(data.owner_phone ?? '')
      setSummaryTime(data.daily_summary_time || '20:00')
    } catch {
      showToast('Gagal memuat pengaturan notifikasi', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!settings) return
    try {
      setSaving(true)
      const res = await ownerApi.updateNotificationSettings({
        whatsapp_enabled: settings.whatsapp_enabled,
        fonnte_api_token: token || null,
        notify_on_received: settings.notify_on_received,
        notify_on_done: settings.notify_on_done,
        notify_on_picked_up: settings.notify_on_picked_up,
        daily_summary_enabled: settings.daily_summary_enabled,
        daily_summary_time: summaryTime,
        owner_phone: ownerPhone || null,
      })
      setSettings(res.data ?? res)
      showToast('Pengaturan notifikasi berhasil disimpan', 'success')
    } catch {
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof NotificationSettings) => {
    if (!settings) return
    setSettings({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.navigate({ to: '/manage' })}>
          <ArrowLeft size={20} weight="bold" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Notifikasi WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Kirim update otomatis ke pelanggan</p>
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <ManageListSkeleton />
        ) : !settings ? (
          <p className="text-center text-muted-foreground py-8">Gagal memuat data</p>
        ) : (
          <div className="space-y-4">
            {/* WhatsApp Toggle */}
            <div className="bg-card border rounded-[var(--radius)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WhatsappLogo size={24} weight="fill" className="text-green-500" />
                  <div>
                    <p className="font-semibold">Notifikasi WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Kirim pesan otomatis via WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('whatsapp_enabled')}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.whatsapp_enabled ? 'bg-green-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.whatsapp_enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings.whatsapp_enabled && (
              <>
                {/* API Token */}
                <div className="bg-card border rounded-[var(--radius)] p-4 space-y-2">
                  <label className="text-sm font-medium" htmlFor="fonnte-token">
                    Fonnte API Token
                  </label>
                  <input
                    id="fonnte-token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Masukkan API token dari fonnte.com"
                    className="w-full px-3 py-2 text-sm border rounded-[var(--radius)] bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Daftar di{' '}
                    <a
                      href="https://fonnte.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      fonnte.com
                    </a>{' '}
                    untuk mendapatkan API token.
                  </p>
                </div>

                {/* Notification triggers */}
                <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Kirim Notifikasi Saat
                  </h3>

                  <ToggleRow
                    label="Pesanan diterima"
                    description="Konfirmasi cucian sudah diterima"
                    enabled={settings.notify_on_received}
                    onToggle={() => toggle('notify_on_received')}
                  />
                  <ToggleRow
                    label="Cucian selesai"
                    description="Beritahu pelanggan cucian siap diambil"
                    enabled={settings.notify_on_done}
                    onToggle={() => toggle('notify_on_done')}
                  />
                  <ToggleRow
                    label="Cucian diambil"
                    description="Konfirmasi cucian sudah diambil"
                    enabled={settings.notify_on_picked_up}
                    onToggle={() => toggle('notify_on_picked_up')}
                  />
                </div>

                {/* Daily Summary */}
                <div className="bg-card border rounded-[var(--radius)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChartBar size={24} weight="fill" className="text-primary" />
                      <div>
                        <p className="font-semibold">Ringkasan Harian</p>
                        <p className="text-xs text-muted-foreground">
                          Kirim laporan pendapatan harian via WhatsApp
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle('daily_summary_enabled')}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.daily_summary_enabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.daily_summary_enabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {settings.daily_summary_enabled && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div>
                        <label htmlFor="owner-phone" className="text-sm font-medium mb-1 block">
                          No. WhatsApp Pemilik
                        </label>
                        <input
                          id="owner-phone"
                          type="tel"
                          inputMode="tel"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-3 py-2 text-sm border rounded-[var(--radius)] bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nomor WhatsApp untuk menerima ringkasan harian
                        </p>
                      </div>
                      <div>
                        <label htmlFor="summary-time" className="text-sm font-medium mb-1 block">
                          Waktu Kirim
                        </label>
                        <input
                          id="summary-time"
                          type="time"
                          value={summaryTime}
                          onChange={(e) => setSummaryTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-[var(--radius)] bg-background"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Ringkasan akan dikirim setiap hari pada jam ini
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          enabled ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}
