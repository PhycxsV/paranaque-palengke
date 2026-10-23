import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useOrderStore } from '@/stores/order-store'
import { formatDateTime, formatPeso } from '@/lib/utils'

export default function OrdersPage() {
  const orders = useOrderStore((s) => s.orders)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-primary-deep">My Orders</h1>
      <p className="mt-1 text-sm text-muted">
        {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
      </p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Once you checkout, your orders will appear here."
            actionLabel="Browse products"
            onAction={() => {
              window.location.href = '/customer/products'
            }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/customer/orders/${order.id}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                <Package className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-bold text-primary-deep">
                    {order.vendorName}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-mono">{order.id}</span>
                  {' · '}
                  {formatDateTime(order.createdAt)}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatPeso(order.total)}
                  <span className="ml-1 font-normal text-muted">
                    · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </span>
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
