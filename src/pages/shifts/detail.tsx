import { CaretLeft, ClipboardText } from '@phosphor-icons/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { DetailSkeleton } from '@/components/shared/skeleton-loaders'
import { ShiftSummary } from '@/components/shift/shift-summary'
import { Button } from '@/components/ui/button'
import type { ShiftSummary as ShiftSummaryType } from '@/services/shift-api'
import { shiftApi } from '@/services/shift-api'

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
    return <DetailSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <InlineError
          message="Tidak dapat memuat detail shift."
          onRetry={() => {
            setError(false)
            setLoading(true)
            shiftApi
              .getSummary(id!)
              .then((res) => setSummary(res.data))
              .catch(() => setError(true))
              .finally(() => setLoading(false))
          }}
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.navigate({ to: '/shifts' })}
        >
          <CaretLeft size={16} className="mr-1" weight="bold" />
          Kembali
        </Button>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <EmptyState
          icon={<ClipboardText size={48} weight="fill" />}
          title="Shift Tidak Ditemukan"
          description="Data shift tidak tersedia."
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.navigate({ to: '/shifts' })}
        >
          <CaretLeft size={16} className="mr-1" weight="bold" />
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
          <CaretLeft size={16} weight="bold" />
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
