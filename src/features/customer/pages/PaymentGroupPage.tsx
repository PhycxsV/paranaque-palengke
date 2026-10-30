import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useOrderStore } from '@/stores/order-store'
import { useVendorStore } from '@/stores/vendor-store'
import { formatPeso } from '@/lib/utils'
import type { Order } from '@/types'

function VendorPaymentCard({
  order,
  onPaid,
}: {
  order: Order
  onPaid: () => void
}) {
  const vendors = useVendorStore((s) => s.vendors)
  const submitDemoPayment = useOrderStore((s) => s.submitDemoPayment)
  const vendor = vendors.find((v) => v.id === order.vendorId)
  const [ref, setRef] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canPay =
    order.status === 'pending_payment' || order.status === 'payment_rejected'
  const awaiting = order.status === 'awaiting_vendor_confirmation'
  const confirmed = order.status === 'confirmed'

  const handlePay = () => {
    setSubmitting(true)
    const result = submitDemoPayment(order.id, ref)
    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }
    toast.success(`Payment submitted for ${order.vendorName}`)
    setSubmitting(false)
    onPaid()
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-primary-deep">{order.vendorName}</h2>
          <p className="font-mono text-xs text-muted">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-4 flex justify-between border-b border-border pb-3 text-sm">
        <span className="text-muted">Amount (items + delivery share)</span>
        <span className="font-bold text-primary">{formatPeso(order.total)}</span>
      </div>

      {confirmed && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">
              Payment confirmed by vendor
            </p>
          </div>
          {order.deliveryStatus ? (
            <DeliveryMilestoneTracker deliveryStatus={order.deliveryStatus} />
          ) : null}
        </div>
      )}

      {awaiting && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            Awaiting vendor confirmation
          </p>
          {order.transactionReference ? (
            <p className="mt-1 text-xs text-amber-700">
              Ref: {order.transactionReference}
            </p>
          ) : null}
        </div>
      )}

      {canPay && (
        <div className="space-y-4">
          <DemoQrPlaceholder
            label={vendor?.demoQrLabel ?? 'Demo QR'}
            amountLabel={formatPeso(order.total)}
          />
          <div>
            <Label htmlFor={`ref-${order.id}`}>
              Transaction reference (optional)
            </Label>
            <Input
              id={`ref-${order.id}`}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. DEMO-REF-12345"
              className="mt-1"
            />
          </div>
          <Button
            className="w-full"
            onClick={handlePay}
            disabled={submitting}
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? 'Submitting...' : `I've Paid ${order.vendorName}`}
          </Button>
        </div>
      )}
    </section>
  )
}

export default function PaymentGroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const groupOrders = orders.filter((o) => o.checkoutGroupId === groupId)
  const [, setTick] = useState(0)

  if (!groupId || groupOrders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Clock}
          title="Checkout not found"
          description="This payment group may not exist or was cleared."
          actionLabel="View my orders"
          onAction={() => navigate('/customer/orders')}
        />
      </div>
    )
  }

  const allConfirmed = groupOrders.every((o) => o.status === 'confirmed')
  const allPaid = groupOrders.every(
    (o) =>
      o.status === 'awaiting_vendor_confirmation' ||
      o.status === 'confirmed' ||
      o.status === 'payment_rejected',
  )
  const pendingCount = groupOrders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'payment_rejected',
  ).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/customer/orders">
          <ArrowLeft className="h-4 w-4" />
          My orders
        </Link>
      </Button>

      <h1 className="text-2xl font-extrabold text-primary-deep">
        Pay each vendor
      </h1>
      <p className="mt-1 text-sm text-muted">
        Group <span className="font-mono">{groupId}</span> ·{' '}
        {groupOrders.length} QRPH payment
        {groupOrders.length === 1 ? '' : 's'}
      </p>

      <div className="mt-4 rounded-xl border border-border bg-primary-50/50 p-4 text-sm text-primary-deep">
        {allConfirmed
          ? 'All vendor payments confirmed. Keri delivery can proceed per vendor.'
          : allPaid
            ? 'All payments submitted. Vendors can now confirm — delivery unlocks after every vendor confirms.'
            : `Submit payment for ${pendingCount} remaining vendor QR${pendingCount === 1 ? '' : 's'}.`}
      </div>

      <div className="mt-6 space-y-6">
        {groupOrders.map((order) => (
          <VendorPaymentCard
            key={order.id}
            order={order}
            onPaid={() => setTick((t) => t + 1)}
          />
        ))}
      </div>
    </div>
  )
}
