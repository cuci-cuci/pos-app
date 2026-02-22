import { useState, useEffect } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { shiftApi } from '@/services/shift-api'
import { ShiftSummary } from '@/components/shift/shift-summary'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import type { ShiftSummary as ShiftSummaryType } from '@/services/shift-api'

export function ShiftDetailPage() {
  const { id } = useParams({ strict: false })
  const router = useRouter()
  const [summary, setSummary] = useState<ShiftSummaryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    shiftApi
      .getSummary(id)
      .then((res) => setSummary(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <EmptyState
          icon={<AlertTriangle size={48} />}
          title="Gagal memuat"
          description="Tidak dapat memuat detail shift."
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.navigate({ to: '/shifts' })}
        >
          <ChevronLeft size={16} className="mr-1" />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.navigate({ to: '/shifts' })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>
        <h1 className="text-xl font-bold">Detail Shift</h1>
      </div>

      <div className="px-4 pb-6">
        <ShiftSummary summary={summary} />
      </div>
    </div>
  )
}
