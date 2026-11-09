import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { DELIVERY_STATUS_LABELS } from '@/constants'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { Notice } from '@/components/shared/Notice'
import { PortalHeader } from '@/components/shared/PortalHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOrderStore } from '@/stores/order-store'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

function Field({
  label,
  children,
  mono,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd
        className={
          mono
            ? 'mt-0.5 break-all font-mono text-xs text-ink'
            : 'mt-0.5 text-sm font-semibold text-primary-deep'
        }
      >
        {children}
      </dd>
    </div>
  )
}

export default function VendorOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const orders = useOrderStore((s) => s.orders)
  const confirmPayment = useOrderStore((s) => s.confirmPayment)
  const rejectPayment = useOrderStore((s) => s.rejectPayment)
  const advanceDelivery = useOrderStore((s) => s.advanceDelivery)

  const [processing, setProcessing] = useState(false)

  const order = useMemo<Order | undefined>(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId],
  )

  if (!order || order.vendorId !== activeVendorId) {
    const denied = Boolean(order)
    return (
      <div className="space-y-6">
        <PortalHeader
          title={denied ? 'Access denied' : 'Order not found'}
          back={{ to: '/vendor/orders', label: 'Back to orders' }}
        />
        <EmptyState
          icon={XCircle}
          title={denied ? 'Access denied' : 'Order not found'}
          description={
            denied
              ? 'This order belongs to a different vendor.'
              : `No order with ID "${orderId ?? ''}" was found.`
          }
        />
      </div>
    )
  }

  const canProcess = order.status === 'awaiting_vendor_confirmation'

  const handleConfirm = () => {
    if (processing) return
    setProcessing(true)
    const result = confirmPayment(order.id, activeVendorId)
    if (result.ok) {
      toast.success('Payment confirmed successfully')
    } else {
      toast.error(result.message)
    }
    setProcessing(false)
  }

  const handleReject = () => {
    if (processing) return
    setProcessing(true)
    const result = rejectPayment(order.id, activeVendorId)
    if (result.ok) {
      toast.error('Payment has been rejected')
    } else {
      toast.error(result.message)
    }
    setProcessing(false)
  }

  const handleAdvanceDelivery = () => {
    if (processing) return
    setProcessing(true)
    const result = advanceDelivery(order.id, activeVendorId)
    if (result.ok) {
      const label =
        DELIVERY_STATUS_LABELS[result.order.deliveryStatus ?? 'awaiting_pickup']
      toast.success(`Keri delivery updated: ${label}`)
    } else {
      toast.error(result.message)
    }
    setProcessing(false)
  }

  const deliveryStatus = order.deliveryStatus ?? 'awaiting_pickup'
  const canAdvanceDelivery =
    order.status === 'confirmed' && deliveryStatus !== 'delivered'

  const statusNotice = (() => {
    switch (order.status) {
      case 'awaiting_vendor_confirmation':
        return (
          <Notice tone="pending" title="Customer submitted payment">
            Check the transaction reference, then confirm or reject below.
          </Notice>
        )
      case 'confirmed':
        return (
          <Notice tone="success" title="Payment confirmed">
            {deliveryStatus === 'delivered'
              ? 'Keri delivery is complete.'
              : 'Prepare the order for Keri pickup and update the delivery status as it moves.'}
          </Notice>
        )
      case 'payment_rejected':
        return (
          <Notice tone="danger" title="Payment rejected">
            The customer may resubmit their payment details.
          </Notice>
        )
      default:
        return (
          <Notice tone="info" title="Waiting for the customer">
            This order is not yet ready for vendor confirmation.
          </Notice>
        )
    }
  })()

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Order"
        title={order.id}
        description={`${order.customerName} · placed ${formatDateTime(order.createdAt)}`}
        back={{ to: '/vendor/orders', label: 'Back to orders' }}
        actions={<StatusBadge status={order.status} />}
      />

      {statusNotice}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Items */}
          <SectionCard
            title={`Items (${order.items.length})`}
            icon={Package}
            bodyClassName="p-0 sm:p-0"
          >
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center gap-4 px-5 py-4 sm:px-6"
                >
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
                      {formatPeso(item.unitPrice)} / {item.unit} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-primary-deep">
                    {formatPeso(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-border bg-primary-50/40 px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd>{formatPeso(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Delivery (Keri)</dt>
                <dd>{formatPeso(order.deliveryFee ?? 0)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-2">
                <dt className="font-bold text-primary-deep">Order total</dt>
                <dd className="font-display text-2xl font-extrabold text-primary">
                  {formatPeso(order.total)}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {order.status === 'confirmed' ? (
            <SectionCard title="Keri delivery" icon={Truck}>
              <div className="space-y-5">
                <DeliveryMilestoneTracker deliveryStatus={deliveryStatus} />
                {canAdvanceDelivery ? (
                  <Button onClick={handleAdvanceDelivery} disabled={processing}>
                    <Truck className="h-4 w-4" />
                    {deliveryStatus === 'awaiting_pickup'
                      ? 'Mark out for delivery (Keri)'
                      : 'Mark delivered'}
                  </Button>
                ) : null}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <aside className="space-y-6">
          {canProcess ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep to-primary p-5 text-white shadow-[var(--shadow-lift)]">
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime/25 blur-2xl"
                aria-hidden
              />
              <p className="relative text-lg font-extrabold">Review payment</p>
              <p className="relative mt-1 text-xs leading-relaxed text-white/75">
                All vendors in this booking group must receive payment before any
                vendor can confirm. Sibling orders share one Keri tracking ID once
                dispatched.
              </p>
              <div className="relative mt-4 grid gap-2.5">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="lime" size="lg" disabled={processing}>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm payment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm payment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the order as confirmed. Keri delivery
                        starts only after every vendor in the same checkout has
                        confirmed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirm}>
                        Yes, confirm payment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={processing}
                      className="border border-white/25 bg-white/10 text-white shadow-none hover:bg-red-600 hover:text-white"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject payment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject payment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the payment as rejected. The customer can
                        resubmit their demo payment details afterwards.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReject}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Yes, reject payment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : null}

          <SectionCard title="Customer" icon={User}>
            <dl className="grid gap-4">
              <Field label="Name">{order.customerName}</Field>
              <Field label="Contact">{order.contactNumber}</Field>
              {order.notes ? <Field label="Notes">{order.notes}</Field> : null}
              <Field label="Last updated">{formatDateTime(order.updatedAt)}</Field>
            </dl>
          </SectionCard>

          <SectionCard title="Payment" icon={CreditCard}>
            <dl className="grid gap-4">
              <Field label="Transaction reference" mono>
                {order.transactionReference ?? '—'}
              </Field>
              {order.paymentSubmittedAt ? (
                <Field label="Submitted">
                  {formatDateTime(order.paymentSubmittedAt)}
                </Field>
              ) : null}
              <Field label="Booking group" mono>
                {order.bookingGroupId}
              </Field>
            </dl>
          </SectionCard>

          <SectionCard title="Keri pickup" icon={MapPin}>
            <dl className="grid gap-4">
              <Field label="Palengke">{order.branchName}</Field>
              <Field label="Coordinates" mono>
                {order.pickupLat.toFixed(5)}, {order.pickupLng.toFixed(5)}
              </Field>
              <Field label="Tracking ID" mono>
                {order.keriTrackingId ?? 'Assigned when dispatched'}
              </Field>
            </dl>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}