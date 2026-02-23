import { CaretLeft, CaretRight, ClockCounterClockwise } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { InlineError } from '@/components/shared/inline-error'
import { ManageListSkeleton } from '@/components/shared/skeleton-loaders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import type { Shift } from '@/services/shift-api'
import { shiftApi } from '@/services/shift-api'

export function ShiftsPage() {
  const router = useRouter()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchShifts = useCallback(() => {
    setLoading(true)
    setError(false)
    shiftApi
      .list(page)
      .then((res) => {
        setShifts(res.data)
        setTotalPages(res.meta.total_pages)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  if (loading) {
    return <ManageListSkeleton />
  }

  if (error) {
    return <InlineError message="Gagal memuat riwayat shift." onRetry={fetchShifts} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Riwayat Shift</h1>
        <p className="text-sm text-muted-foreground">Lihat semua shift yang pernah dibuka.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {shifts.length === 0 ? (
          <EmptyState
            icon={<ClockCounterClockwise size={48} weight="fill" />}
            title="Belum ada shift"
            description="Shift akan muncul di sini setelah Anda membuka shift pertama."
          />
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => (
              <button
                type="button"
                key={shift.id}
                onClick={() =>
                  router.navigate({
                    to: '/shifts/$id',
                    params: { id: shift.id },
                  })
                }
                className="w-full text-left bg-card rounded-[var(--radius)] border p-3 active:bg-muted transition-colors touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatDate(shift.opened_at)}</span>
                      <Badge variant={shift.status === 'open' ? 'success' : 'secondary'}>
                        {shift.status === 'open' ? 'Aktif' : 'Ditutup'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(shift.opened_at)}
                      {shift.closed_at ? ` - ${formatTime(shift.closed_at)}` : ' - sekarang'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(shift.opening_cash)}</p>
                    <p className="text-xs text-muted-foreground">kas awal</p>
                  </div>
                </div>
                {shift.status === 'closed' && shift.cash_difference != null && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Selisih kas</span>
                    <span
                      className={`font-medium ${
                        shift.cash_difference < 0
                          ? 'text-red-600 dark:text-red-400'
                          : shift.cash_difference > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {formatCurrency(shift.cash_difference)}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <CaretLeft size={16} weight="bold" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <CaretRight size={16} weight="bold" />
          </Button>
        </div>
      )}
    </div>
  )
}
