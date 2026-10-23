import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquare,
  Package,
  ShoppingCart,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useOrderStore } from '@/stores/order-store'
import { useOfferStore } from '@/stores/offer-store'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

export default function VendorDashboardPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const vendor = useVendorStore((s) =>
    s.vendors.find((v) => v.id === activeVendorId),
  )
  const getOrdersByVendor = useOrderStore((s) => s.getOrdersByVendor)
  const getOffersByVendor = useOfferStore((s) => s.getOffersByVendor)

  const vendorOrders = useMemo<Order[]>(
    () => getOrdersByVendor(activeVendorId),
    [getOrdersByVendor, activeVendorId],
  )

  const vendorOffers = useMemo(
    () => getOffersByVendor(activeVendorId),
    [getOffersByVendor, activeVendorId],
  )

  const stats = useMemo(() => {
    const total = vendorOrders.length
    const awaiting = vendorOrders.filter(
      (o) => o.status === 'awaiting_vendor_confirmation',
    ).length
    const confirmed = vendorOrders.filter((o) => o.status === 'confirmed').length
    const rejected = vendorOrders.filter(
      (o) => o.status === 'payment_rejected',
    ).length
    const pendingOffers = vendorOffers.filter((o) => o.status === 'pending').length
    return { total, awaiting, confirmed, rejected, pendingOffers }
  }, [vendorOrders, vendorOffers])

  const recentOrders = vendorOrders.slice(0, 5)

  const summaryCards = [
    {
      label: 'Total orders',
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary-50',
    },
    {
      label: 'Awaiting confirmation',
      value: stats.awaiting,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Payment rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Pending offers',
      value: stats.pendingOffers,
      icon: MessageSquare,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Welcome back, {vendor?.name ?? 'Vendor'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <p className="text-2xl font-extrabold text-primary-deep">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/vendor/orders">
            <ClipboardList className="h-4 w-4" />
            View all orders
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/vendor/products">
            <Package className="h-4 w-4" />
            Manage products
          </Link>
        </Button>
        {stats.pendingOffers > 0 && (
          <Button variant="secondary" asChild>
            <Link to="/vendor/offers">
              <MessageSquare className="h-4 w-4" />
              {stats.pendingOffers} pending offer{stats.pendingOffers !== 1 ? 's' : ''}
            </Link>
          </Button>
        )}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>Recent orders</CardTitle>
          {vendorOrders.length > 5 ? (
            <Button variant="link" size="sm" asChild>
              <Link to="/vendor/orders">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No orders yet"
              description="Orders from customers will appear here once they check out."
            />
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/vendor/orders/${order.id}`}
                  className="flex flex-col gap-2 py-3 transition hover:bg-warm-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary-deep">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted">
                      {order.id} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-primary-deep">
                      {formatPeso(order.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
