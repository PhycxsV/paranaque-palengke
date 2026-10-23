import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOrderStore } from '@/stores/order-store'
import { ORDER_STATUS_LABELS } from '@/constants'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

type FilterTab = 'all' | OrderStatus

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_payment', label: ORDER_STATUS_LABELS.pending_payment },
  {
    value: 'awaiting_vendor_confirmation',
    label: 'Awaiting Confirmation',
  },
  { value: 'confirmed', label: ORDER_STATUS_LABELS.confirmed },
  { value: 'payment_rejected', label: ORDER_STATUS_LABELS.payment_rejected },
]

export default function VendorOrdersPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const getOrdersByVendor = useOrderStore((s) => s.getOrdersByVendor)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const vendorOrders = useMemo<Order[]>(
    () => getOrdersByVendor(activeVendorId),
    [getOrdersByVendor, activeVendorId],
  )

  const filteredOrders = useMemo(
    () =>
      activeTab === 'all'
        ? vendorOrders
        : vendorOrders.filter((o) => o.status === activeTab),
    [vendorOrders, activeTab],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          Manage and review customer orders
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={activeTab === tab.value ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description={
            activeTab === 'all'
              ? 'You have no orders yet. Orders will appear here when customers check out.'
              : `No orders with status "${FILTER_TABS.find((t) => t.value === activeTab)?.label ?? activeTab}".`
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-warm-white text-left">
                    <th className="px-4 py-3 font-semibold text-muted">
                      Order
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted">Date</th>
                    <th className="px-4 py-3 font-semibold text-muted">
                      Total
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-warm-white"
                    >
                      <td className="px-4 py-3 font-medium text-primary-deep">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatPeso(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="link" size="sm" asChild>
                          <Link to={`/vendor/orders/${order.id}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/vendor/orders/${order.id}`}
                className="block"
              >
                <Card className="p-4 transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-primary-deep">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{order.id}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>{formatDateTime(order.createdAt)}</span>
                    <span className="text-sm font-bold text-primary-deep">
                      {formatPeso(order.total)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
