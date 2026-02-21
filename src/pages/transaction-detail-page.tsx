import { useParams, useRouter } from '@tanstack/react-router'
import { TransactionDetail } from '@/components/transaction/transaction-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

export function TransactionDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/transactions' })}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">Detail Transaksi</h1>
      </div>
      <TransactionDetail transactionId={id} />
    </div>
  )
}
