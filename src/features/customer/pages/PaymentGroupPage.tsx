import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, CreditCard, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutSteps } from '@/components/shared/CheckoutSteps'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { EmptyState } from '@/components/shared/EmptyState'
import { Notice } from '@/components/shared/Notice'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
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
    <SectionCard
      title={order.vendorName}
      icon={Store}
      action={<StatusBadge status={order.status} />}
    >
      <p className="-mt-1 mb-4 font-mono text-xs text-muted">{order.id}</p>

      <div className="mb-5 flex items-center justify-between rounded-xl bg-primary-50/70 px-4 py-3">
        <span className="text-sm text-muted">Amount (items + delivery share)</span>
        <span className="font-display text-xl font-extrabold text-primary">
          {formatPeso(order.total)}
        </span>
      </div>

      {confirmed && (
        <div className="space-y-4">
          <Notice tone="success" layout="panel" title="Payment confirmed by vendor" />
          {order.deliveryStatus ? (
            <DeliveryMilestoneTracker deliveryStatus={order.deliveryStatus} />
          ) : null}
        </div>
      )}

      {awaiting && (
        <Notice tone="pending" layout="panel" title="Awaiting vendor confirmation">
          {order.transactionReference ? (
            <span className="text-xs">Ref: {order.transactionReference}</span>
          ) : null}
        </Notice>
      )}

      {canPay && (
        <div className="space-y-5">
          <DemoQrPlaceholder
            label={vendor?.demoQrLabel ?? 'Demo QR'}
            amountLabel={formatPeso(order.total)}
          />
          <div className="grid gap-1.5">
            <Label htmlFor={`ref-${order.id}`}>
              Transaction reference (optional)
            </Label>
            <Input
              id={`ref-${order.id}`}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. DEMO-REF-12345"
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handlePay}
            disabled={submitting}
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? 'Submitting...' : `I've Paid ${order.vendorName}`}
          </Button>
        </div>
      )}
    </SectionCard>
  )
}

export default function PaymentGroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const groupOrders = orders.filter((o) => o.bookingGroupId === groupId)
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
    <>
      <PageHeader
        width="narrow"
        eyebrow="Payment"
        title="Pay each vendor"
        back={{ to: '/customer/orders', label: 'My orders' }}
        description={
          <>
            Group <span className="font-mono">{groupId}</span> ·{' '}
            {groupOrders.length} QRPH payment
            {groupOrders.length === 1 ? '' : 's'}
          </>
        }
      >
        <CheckoutSteps current={allConfirmed ? 3 : 2} />
      </PageHeader>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <Notice tone={allConfirmed ? 'success' : allPaid ? 'pending' : 'info'}>
          {allConfirmed
            ? 'All vendor payments confirmed. Keri delivery can proceed per vendor.'
            : allPaid
              ? 'All payments submitted. Vendors can now confirm — delivery unlocks after every vendor confirms.'
              : `Submit payment for ${pendingCount} remaining vendor QR${pendingCount === 1 ? '' : 's'}.`}
        </Notice>

        {groupOrders.map((order) => (
          <VendorPaymentCard
            key={order.id}
            order={order}
            onPaid={() => setTick((t) => t + 1)}
          />
        ))}
      </div>
    </>
  )
}
