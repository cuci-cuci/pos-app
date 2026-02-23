import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-[var(--radius)] p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="border rounded-[var(--radius)] p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TransactionListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-[var(--radius)] p-3 flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="text-right space-y-1.5">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ManageListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-[var(--radius)] p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[var(--radius)] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function ServiceGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-[var(--radius)] p-2.5 space-y-2 min-h-[72px]">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-3 w-16 mt-auto" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[var(--radius)]" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="border rounded-[var(--radius)] p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-[var(--radius)] p-4 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[var(--radius)]" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-[var(--radius)] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-[var(--radius)]" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="border rounded-[var(--radius)] p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  )
}
