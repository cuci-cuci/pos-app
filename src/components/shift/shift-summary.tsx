import { formatCurrency, formatDate, formatTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  UserCircle,
  Storefront,
  Receipt,
  CurrencyDollar,
  ArrowsLeftRight,
} from '@phosphor-icons/react'
import type { ShiftSummary as ShiftSummaryType } from '@/services/shift-api'

interface ShiftSummaryProps {
  summary: ShiftSummaryType
}

export function ShiftSummary({ summary }: ShiftSummaryProps) {
  const difference = summary.cash_difference ?? 0

  return (
    <div className="space-y-4">
      {/* Shift info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock size={18} />
              Detail Shift
            </span>
            <Badge variant={summary.status === 'open' ? 'success' : 'secondary'}>
              {summary.status === 'open' ? 'Aktif' : 'Ditutup'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <UserCircle size={14} />
              Kasir
            </span>
            <span className="font-medium">{summary.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Storefront size={14} />
              Outlet
            </span>
            <span className="font-medium text-xs text-muted-foreground">
              {summary.outlet_id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dibuka</span>
            <span className="font-medium">
              {formatDate(summary.opened_at)} {formatTime(summary.opened_at)}
            </span>
          </div>
          {summary.closed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ditutup</span>
              <span className="font-medium">
                {formatDate(summary.closed_at)} {formatTime(summary.closed_at)}
              </span>
            </div>
          )}
          {summary.notes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catatan</span>
              <span className="font-medium text-right max-w-[200px]">{summary.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt size={18} />
            Pendapatan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Transaksi</span>
            <span className="font-semibold">{summary.transaction_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pendapatan</span>
            <span className="font-bold text-base">{formatCurrency(summary.total_revenue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment breakdown */}
      {summary.payment_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CurrencyDollar size={18} />
              Breakdown Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.payment_breakdown.map((pb) => (
              <div key={pb.payment_type} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{pb.payment_type}</span>
                <span className="font-medium">
                  {pb.count}x - {formatCurrency(pb.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cash reconciliation */}
      {summary.status === 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowsLeftRight size={18} />
              Rekonsiliasi Kas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kas Awal</span>
              <span className="font-medium">{formatCurrency(summary.opening_cash)}</span>
            </div>
            {summary.expected_cash != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kas yang Diharapkan</span>
                <span className="font-medium">{formatCurrency(summary.expected_cash)}</span>
              </div>
            )}
            {summary.closing_cash != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kas Akhir (Aktual)</span>
                <span className="font-bold">{formatCurrency(summary.closing_cash)}</span>
              </div>
            )}
            <div
              className={`flex justify-between border-t border-border pt-2 font-medium ${
                difference < 0
                  ? 'text-red-600 dark:text-red-400'
                  : difference > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-green-600 dark:text-green-400'
              }`}
            >
              <span>Selisih</span>
              <span className="font-bold">{formatCurrency(difference)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
