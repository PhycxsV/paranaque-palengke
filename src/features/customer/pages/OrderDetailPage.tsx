import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ProductImage } from '@/components/shared/ProductImage'
import { useOrderStore } from '@/stores/order-store'
import { ORDER_STATUS_MESSAGES } from '@/constants'
import { formatDateTime, formatPeso } from '@/lib/utils'

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)

  const order = orders.find((o) => o.id === orderId)

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Package}
          title="Order not found"
          description="This order may not exist or has been removed."
          actionLabel="View my orders"
          onAction={() => navigate('/customer/orders')}
        />
      </div>
    )
  }

  const canPay = order.status === 'pending_payment' || order.status === 'payment_rejected'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/customer/orders">
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-deep">Order Details</h1>
          <p className="mt-1 font-mono text-sm text-muted">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status message */}
      <div className="mb-6 rounded-xl border border-border bg-primary-50/50 p-4">
        <p className="text-sm font-medium text-primary-deep">
          {ORDER_STATUS_MESSAGES[order.status]}
        </p>
      </div>

      {order.status === 'confirmed' && (
        <DeliveryMilestoneTracker
          className="mb-6"
          deliveryStatus={order.deliveryStatus ?? 'awaiting_pickup'}
        />
      )}

      {/* Payment action */}
      {canPay && (
        <div className="mb-6">
          <Button asChild size="lg" className="w-full">
            <Link to={`/customer/payment/${order.id}`}>
              <CreditCard className="h-5 w-5" />
              {order.status === 'payment_rejected' ? 'Resubmit Payment' : 'Complete Payment'}
            </Link>
          </Button>
        </div>
      )}

      {/* Order info */}
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">Order Information</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Customer</dt>
              <dd className="font-medium text-ink">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-muted">Contact</dt>
              <dd className="font-medium text-ink">{order.contactNumber}</dd>
            </div>
            <div>
              <dt className="text-muted">Vendor</dt>
              <dd className="font-medium text-ink">
                <Link to={`/customer/stores/${order.vendorId}`} className="text-primary hover:underline">
                  {order.vendorName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Placed</dt>
              <dd className="font-medium text-ink">{formatDateTime(order.createdAt)}</dd>
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Notes</dt>
                <dd className="font-medium text-ink">{order.notes}</dd>
              </div>
            )}
            {order.transactionReference && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Transaction Reference</dt>
                <dd className="font-mono font-medium text-ink">
                  {order.transactionReference}
                </dd>
              </div>
            )}
            {order.paymentSubmittedAt && (
              <div>
                <dt className="text-muted">Payment Submitted</dt>
                <dd className="font-medium text-ink">
                  {formatDateTime(order.paymentSubmittedAt)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Last Updated</dt>
              <dd className="font-medium text-ink">{formatDateTime(order.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        {/* Items */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">Items</h2>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 shrink-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-deep">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.quantity} × {formatPeso(item.unitPrice)} / {item.unit}
                    {item.pricingSource === 'negotiated' && (
                      <span className="ml-1 text-emerald-600">
                        (negotiated
                        <span className="ml-1 line-through">
                          {formatPeso(item.standardUnitPrice)}
                        </span>
                        )
                      </span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-primary-deep">
                  {formatPeso(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm text-ink/80">
              <span>Subtotal</span>
              <span>{formatPeso(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink/80">
              <span>Delivery fee</span>
              <span>{formatPeso(order.deliveryFee ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-primary-deep">
              <span>Total</span>
              <span>{formatPeso(order.total)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
