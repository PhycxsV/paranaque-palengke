import { ClipboardList } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useOrderStore } from '@/stores/order-store'
import { formatPeso, formatDateTime } from '@/lib/utils'

export default function AdminOrdersPage() {
  const orders = useOrderStore((s) => s.orders)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          All Orders
        </h1>
        <p className="mt-1 text-sm text-muted">
          Monitor marketplace orders (read-only)
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Orders will appear here once customers place them."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-warm-white text-left">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Order ID
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Customer
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Vendor
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Items
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Total
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-warm-white/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium">
                    {order.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {order.customerName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {order.vendorName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {order.items.length}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-primary-deep">
                    {formatPeso(order.total)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {orders.length > 0 && (
        <div className="space-y-3 sm:hidden">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted">{order.id}</p>
                    <p className="font-semibold text-primary-deep">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted">{order.vendorName}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {order.items.length} item{order.items.length !== 1 && 's'}
                  </span>
                  <span className="font-bold text-primary-deep">
                    {formatPeso(order.total)}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {formatDateTime(order.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
