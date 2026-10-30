import { History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCommodityStore } from '@/stores/commodity-store'
import { formatPeso, formatDateTime } from '@/lib/utils'

function formatRange(min: number, max: number): string {
  return `${formatPeso(min)}–${formatPeso(max)}`
}

export default function AdminPriceHistoryPage() {
  const priceHistory = useCommodityStore((s) => s.priceHistory)
  const commodities = useCommodityStore((s) => s.commodities)

  const getName = (commodityId: string) =>
    commodities.find((c) => c.id === commodityId)?.name ?? commodityId

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Price History
        </h1>
        <p className="mt-1 text-sm text-muted">
          Chronological log of all LGU price-range updates (newest first)
        </p>
      </div>

      {priceHistory.length === 0 ? (
        <EmptyState
          icon={History}
          title="No price changes yet"
          description="Price history entries will appear here when commodity price ranges are updated."
        />
      ) : (
        <div className="space-y-3">
          {priceHistory.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary-deep">
                    {getName(entry.commodityId)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted line-through">
                      {formatRange(entry.previousPriceMin, entry.previousPriceMax)}
                    </span>
                    <span className="text-primary">→</span>
                    <span className="font-bold text-primary">
                      {formatRange(entry.newPriceMin, entry.newPriceMax)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 text-xs text-muted italic">
                      {entry.note}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-muted">
                  <p>Effective {formatDateTime(entry.effectiveFrom)}</p>
                  <p>Changed {formatDateTime(entry.changedAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
