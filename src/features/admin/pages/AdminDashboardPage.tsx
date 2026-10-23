import {
  ClipboardList,
  HandCoins,
  History,
  Store,
  Wheat,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { useOrderStore } from '@/stores/order-store'
import { useVendorStore } from '@/stores/vendor-store'
import { formatPeso, formatDateTime } from '@/lib/utils'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
        <Icon className="h-5 w-5 text-primary/60" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-extrabold text-primary-deep">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const commodities = useCommodityStore((s) => s.commodities)
  const priceHistory = useCommodityStore((s) => s.priceHistory)
  const vendors = useVendorStore((s) => s.vendors)
  const offers = useOfferStore((s) => s.offers)
  const orders = useOrderStore((s) => s.orders)

  const pendingOffers = offers.filter((o) => o.status === 'pending').length
  const awaitingOrders = orders.filter(
    (o) => o.status === 'awaiting_vendor_confirmation',
  ).length
  const recentChanges = priceHistory.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Overview of marketplace activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Wheat}
          label="Commodities"
          value={commodities.length}
          sub={`${commodities.filter((c) => c.isActive).length} active`}
        />
        <StatCard
          icon={Store}
          label="Vendors"
          value={vendors.length}
          sub={`${vendors.filter((v) => v.isAvailable).length} available`}
        />
        <StatCard
          icon={HandCoins}
          label="Pending Offers"
          value={pendingOffers}
          sub={`${offers.length} total offers`}
        />
        <StatCard
          icon={ClipboardList}
          label="Orders Awaiting"
          value={awaitingOrders}
          sub={`${orders.length} total orders`}
        />
        <StatCard
          icon={History}
          label="Price Changes"
          value={priceHistory.length}
          sub={recentChanges.length > 0 ? 'Recent changes below' : 'No changes yet'}
        />
      </div>

      {recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Price Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.map((entry) => {
                const commodity = commodities.find(
                  (c) => c.id === entry.commodityId,
                )
                return (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-primary-deep">
                      {commodity?.name ?? entry.commodityId}
                    </span>
                    <span className="text-muted line-through">
                      {formatPeso(entry.previousPrice)}
                    </span>
                    <span className="font-bold text-primary">
                      {formatPeso(entry.newPrice)}
                    </span>
                    <span className="ml-auto text-xs text-muted">
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
