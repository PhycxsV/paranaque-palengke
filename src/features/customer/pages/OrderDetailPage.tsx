import { Link, useNavigate, useParams } from 'react-router-dom'
import { CreditCard, ListOrdered, Package, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { Notice } from '@/components/shared/Notice'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ProductImage } from '@/components/shared/ProductImage'
import { useOrderStore } from '@/stores/order-store'
import { RateVendorCard } from '../components/RateVendorCard'
import { ORDER_STATUS_MESSAGES } from '@/constants'
import { formatDateTime, formatPeso } from '@/lib/utils'

function Field({
  label,
  children,
  mono,
  wide,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd
        className={
          mono
            ? 'mt-0.5 font-mono text-sm font-semibold text-ink'
            : 'mt-0.5 text-sm font-semibold text-ink'
        }
      >
        {children}
      </dd>
    </div>
  )
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const getOrdersByBookingGroup = useOrderStore((s) => s.getOrdersByBookingGroup)

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
  const groupOrders = getOrdersByBookingGroup(order.bookingGroupId)
  const allGroupConfirmed =
    groupOrders.length > 0 && groupOrders.every((o) => o.status === 'confirmed')
  const waitingOnOtherVendors =
    order.status === 'confirmed' && !allGroupConfirmed

  const statusTone =
    order.status === 'confirmed'
      ? 'success'
      : order.status === 'payment_rejected'
        ? 'danger'
        : order.status === 'awaiting_vendor_confirmation'
          ? 'pending'
          : 'info'

  return (
    <>
      <PageHeader
        width="default"
        eyebrow="Order"
        title="Order Details"
        back={{ to: '/customer/orders', label: 'All orders' }}
        description={<span className="font-mono">{order.id}</span>}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Notice tone={statusTone}>
          <span className="font-semibold">{ORDER_STATUS_MESSAGES[order.status]}</span>
        </Notice>

        {allGroupConfirmed ? (
          <DeliveryMilestoneTracker
            deliveryStatus={order.deliveryStatus ?? 'packing'}
          />
        ) : waitingOnOtherVendors ? (
          <Notice tone="warning" title="Waiting on other vendors">
            Payment confirmed for this vendor. Keri delivery milestones appear once
            all vendors in this booking group have confirmed payment.
          </Notice>
        ) : null}

        {canPay && (
          <Button asChild size="lg" className="w-full">
            <Link to={`/customer/payment/${order.id}`}>
              <CreditCard className="h-5 w-5" />
              {order.status === 'payment_rejected' ? 'Resubmit Payment' : 'Complete Payment'}
            </Link>
          </Button>
        )}

        <RateVendorCard order={order} />

        <SectionCard title="Order information" icon={ReceiptText}>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Customer">{order.customerName}</Field>
            <Field label="Contact">{order.contactNumber}</Field>
            <Field label="Drop-off address" wide>
              {order.deliveryAddress || '—'}
            </Field>
            <Field label="Vendor">
              <Link
                to={`/customer/stores/${order.vendorId}`}
                className="text-primary hover:underline"
              >
                {order.vendorName}
              </Link>
            </Field>
            <Field label="Booking group (Keri)" mono>
              {order.bookingGroupId}
            </Field>
            <Field label="Keri tracking ID" mono>
              {order.keriTrackingId ?? 'Assigned when dispatched'}
            </Field>
            <Field label="Keri pickup (palengke)">
              {order.branchName}
              <span className="mt-0.5 block font-mono text-xs font-medium text-muted">
                {order.pickupLat.toFixed(5)}, {order.pickupLng.toFixed(5)}
              </span>
            </Field>
            <Field label="Placed">{formatDateTime(order.createdAt)}</Field>
            <Field label="Last updated">{formatDateTime(order.updatedAt)}</Field>
            {order.paymentSubmittedAt && (
              <Field label="Payment submitted">
                {formatDateTime(order.paymentSubmittedAt)}
              </Field>
            )}
            {order.transactionReference && (
              <Field label="Transaction reference" mono>
                {order.transactionReference}
              </Field>
            )}
            {order.notes && (
              <Field label="Notes" wide>
                {order.notes}
              </Field>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="Items" icon={ListOrdered}>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3 first:pt-0">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary-deep">
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
          <div className="mt-3 space-y-2 rounded-xl bg-primary-50/60 p-4">
            <div className="flex items-center justify-between text-sm text-ink/80">
              <span>Subtotal</span>
              <span>{formatPeso(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink/80">
              <span>Delivery fee</span>
              <span>{formatPeso(order.deliveryFee ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-primary/20 pt-2">
              <span className="font-bold text-primary-deep">Total</span>
              <span className="font-display text-xl font-extrabold text-primary">
                {formatPeso(order.total)}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  )
}
