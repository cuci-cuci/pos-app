import { CheckCircle, Package, Truck, TShirt, Timer, Wind } from '@phosphor-icons/react'
import { useParams } from '@tanstack/react-router'
import ky from 'ky'
import { useCallback, useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { API_BASE_URL, APP_NAME } from '@/lib/constants'

interface TrackingData {
  id: string
  status: string
  estimated_completion_at: string | null
  completed_at: string | null
  picked_up_at: string | null
  tracking_token: string
  created_at: string
  customer_name: string | null
  order_number: string
  business_name: string
  status_history: { status: string; timestamp: string }[]
}

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  received: { label: 'Diterima', icon: Package, color: 'text-blue-500' },
  washing: { label: 'Dicuci', icon: TShirt, color: 'text-cyan-500' },
  drying: { label: 'Dikeringkan', icon: Wind, color: 'text-orange-500' },
  ironing: { label: 'Disetrika', icon: TShirt, color: 'text-purple-500' },
  done: { label: 'Selesai', icon: CheckCircle, color: 'text-green-500' },
  picked_up: { label: 'Diambil', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Dibatalkan', icon: Package, color: 'text-red-500' },
}

const allStatuses = ['received', 'washing', 'drying', 'ironing', 'done', 'picked_up']

export function OrderTrackingPage() {
  const { token } = useParams({ strict: false }) as { token: string }
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pickupRequesting, setPickupRequesting] = useState(false)
  const [pickupRequested, setPickupRequested] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await ky.get(`${API_BASE_URL}/track/${token}`).json<{ data: TrackingData }>()
      setData(res.data ?? (res as unknown as TrackingData))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleRequestPickup = async () => {
    setPickupRequesting(true)
    try {
      await ky.post(`${API_BASE_URL}/track/${token}/pickup-request`)
      setPickupRequested(true)
      await fetchOrder()
    } catch {
      // silently fail - user can retry
    } finally {
      setPickupRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <Package size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Pesanan Tidak Ditemukan</h1>
        <p className="text-sm text-muted-foreground text-center">
          Kode tracking tidak valid atau pesanan sudah tidak tersedia.
        </p>
      </div>
    )
  }

  const currentStatus = data.status
  const cfg = statusConfig[currentStatus] ?? statusConfig.received
  const StatusIcon = cfg.icon
  const currentIdx = allStatuses.indexOf(currentStatus)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{APP_NAME}</p>
          <h1 className="text-lg font-bold">{data.business_name}</h1>
        </div>

        {/* Current Status */}
        <div className="bg-card border rounded-[var(--radius)] p-5 text-center">
          <StatusIcon size={40} weight="fill" className={`mx-auto mb-3 ${cfg.color}`} />
          <h2 className="text-xl font-bold">{cfg.label}</h2>
          {data.customer_name && (
            <p className="text-sm text-muted-foreground mt-1">
              Halo, {data.customer_name}!
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Pesanan #{data.order_number || data.tracking_token}
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-[var(--radius)] p-4">
          <h3 className="text-sm font-semibold mb-4">Status Pesanan</h3>
          <div className="space-y-0">
            {allStatuses.map((s, i) => {
              const sc = statusConfig[s]
              const isActive = i <= currentIdx
              const historyEntry = data.status_history.find((h) => h.status === s)

              return (
                <div key={s} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isActive
                          ? 'bg-primary border-primary'
                          : 'bg-background border-muted-foreground/30'
                      }`}
                    />
                    {i < allStatuses.length - 1 && (
                      <div
                        className={`w-0.5 h-8 ${
                          i < currentIdx ? 'bg-primary' : 'bg-muted-foreground/20'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? '' : 'text-muted-foreground/50'
                      }`}
                    >
                      {sc.label}
                    </p>
                    {historyEntry && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(historyEntry.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Estimated completion */}
        {data.estimated_completion_at && currentStatus !== 'done' && currentStatus !== 'picked_up' && (
          <div className="bg-card border rounded-[var(--radius)] p-4 flex items-center gap-3">
            <Timer size={20} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Estimasi Selesai</p>
              <p className="text-xs text-muted-foreground">
                {new Date(data.estimated_completion_at).toLocaleString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Pickup request button - shown when order is done */}
        {currentStatus === 'done' && !pickupRequested && (
          <div className="bg-card border rounded-[var(--radius)] p-4 text-center space-y-3">
            <p className="text-sm font-medium">Laundry Anda sudah selesai!</p>
            <p className="text-xs text-muted-foreground">
              Minta penjemputan agar kami mengantarkan pesanan ke alamat Anda.
            </p>
            <button
              type="button"
              onClick={() => void handleRequestPickup()}
              disabled={pickupRequesting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius)] bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              <Truck size={18} weight="bold" />
              {pickupRequesting ? 'Mengirim permintaan...' : 'Minta Penjemputan'}
            </button>
          </div>
        )}

        {pickupRequested && (
          <div className="bg-green-50 border border-green-200 rounded-[var(--radius)] p-4 text-center space-y-1">
            <CheckCircle size={24} weight="fill" className="text-green-500 mx-auto" />
            <p className="text-sm font-medium text-green-700">Permintaan penjemputan terkirim!</p>
            <p className="text-xs text-green-600">
              Tim kami akan segera menghubungi Anda.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by {APP_NAME}
        </p>
      </div>
    </div>
  )
}
