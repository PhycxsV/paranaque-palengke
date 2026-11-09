import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Package, Truck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useOrderStore } from '@/stores/order-store'
import { formatDateTime, formatPeso } from '@/lib/utils'

export default function OrdersPage() {
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)

  return (
    <>
      <PageHeader
        width="default"
        eyebrow="Order history"
        title="My Orders"
        description={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed`}
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Once you checkout, your orders will appear here."
            actionLabel="Browse products"
            onAction={() => navigate('/customer/products')}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const thumbs = order.items.slice(0, 3)
              const extra = order.items.length - thumbs.length
              return (
                <Link
                  key={order.id}
                  to={`/customer/orders/${order.id}`}
                  className="group hover-lift flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5"
                >
                  <div className="flex shrink-0 -space-x-3">
                    {thumbs.map((item) => (
                      <ProductImage
                        key={item.productId}
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-12 rounded-full ring-2 ring-surface sm:h-14 sm:w-14"
                      />
                    ))}
                    {extra > 0 ? (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary ring-2 ring-surface sm:h-14 sm:w-14">
                        +{extra}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-display font-bold text-primary-deep">
                        {order.vendorName}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      <span className="font-mono">{order.id}</span>
                      {' · '}
                      {formatDateTime(order.createdAt)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-display text-base font-extrabold text-primary">
                        {formatPeso(order.total)}
                        <span className="ml-1.5 font-sans text-xs font-medium text-muted">
                          · {order.items.length}{' '}
                          {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </p>
                      {order.keriTrackingId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-bay-50 px-2 py-0.5 text-[10px] font-bold text-[#1e6b64]">
                          <Truck className="h-3 w-3" />
                          {order.keriTrackingId}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
