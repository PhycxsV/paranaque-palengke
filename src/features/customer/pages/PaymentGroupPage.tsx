import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, CreditCard, Store, XCircle } from 'lucide-react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutSteps } from '@/components/shared/CheckoutSteps'
import { DeliveryMilestoneTracker } from '@/components/shared/DeliveryMilestoneTracker'
import { PaymentQrCard } from '@/components/shared/PaymentQrCard'
import { PaymentProofField } from '@/components/shared/PaymentProofField'
import { ReservationCountdownNotice } from '@/components/shared/ReservationCountdownNotice'
import { EmptyState } from '@/components/shared/EmptyState'
import { Notice } from '@/components/shared/Notice'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useOrdersLiveSync } from '@/hooks/useOrdersLiveSync'
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
  const submitPayment = useOrderStore((s) => s.submitPayment)
  const cancelOrder = useOrderStore((s) => s.cancelOrder)
  const vendor = vendors.find((v) => v.id === order.vendorId)
  const [ref, setRef] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const canPay =
    order.status === 'pending_payment' || order.status === 'payment_rejected'
  const awaiting = order.status === 'awaiting_vendor_confirmation'
  const confirmed = order.status === 'confirmed'
  const cancelled = order.status === 'cancelled'
  const canCustomerCancel = canPay

  const handlePay = async () => {
    if (!proofFile) {
      toast.error(`Upload your proof of payment for ${order.vendorName} first.`)
      return
    }
    setSubmitting(true)
    const result = await submitPayment(order.id, ref, proofFile)
    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }
    toast.success(`Payment submitted for ${order.vendorName}`)
    setSubmitting(false)
    onPaid()
  }

  const handleCancel = async () => {
    if (cancelling) return
    setCancelling(true)
    const result = await cancelOrder(order.id, 'customer')
    if (result.ok) {
      toast.success(`Cancelled order for ${order.vendorName}`)
      onPaid()
    } else {
      toast.error(result.message)
    }
    setCancelling(false)
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
            <DeliveryMilestoneTracker
              deliveryStatus={order.deliveryStatus}
              podUrl={order.podUrl}
            />
          ) : null}
        </div>
      )}

      {cancelled && (
        <Notice
          tone="danger"
          layout="panel"
          title={
            order.cancelledBy === 'vendor'
              ? `Cancelled by ${order.vendorName}`
              : order.cancelledBy === 'system'
                ? 'Reservation expired — order cancelled'
                : 'Order cancelled'
          }
        >
          {order.cancelledBy === 'vendor'
            ? `This order was cancelled by ${order.vendorName}.`
            : order.cancelledBy === 'system'
              ? order.cancelReason ??
                'Your 10-minute payment window expired, so your reserved items were returned to the store.'
              : 'You cancelled this order.'}
        </Notice>
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
          {order.status === 'pending_payment' ? (
            <ReservationCountdownNotice expiresAt={order.reservationExpiresAt} />
          ) : null}
          {order.status === 'payment_rejected' && (
            <Notice
              tone="danger"
              title={`${order.vendorName} rejected your payment`}
            >
              {order.vendorName} could not verify your previous payment. Please
              resubmit with the correct transaction reference.
            </Notice>
          )}
          <PaymentQrCard
            label={vendor?.qrLabel ?? 'Payment QR'}
            amountLabel={formatPeso(order.total)}
            imageUrl={vendor?.paymentQrUrl}
          />
          <PaymentProofField
            file={proofFile}
            onChange={setProofFile}
            disabled={submitting}
          />
          <div className="grid gap-1.5">
            <Label htmlFor={`ref-${order.id}`}>
              Transaction reference (optional)
            </Label>
            <Input
              id={`ref-${order.id}`}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. TXN-REF-12345"
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handlePay}
            disabled={submitting || !proofFile}
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? 'Submitting...' : `I've Paid ${order.vendorName}`}
          </Button>
        </div>
      )}

      {canCustomerCancel && (
        <div className="mt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircle className="h-4 w-4" />
                Cancel order with {order.vendorName}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel only your order with {order.vendorName}. Other
                  vendors in this checkout are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep order</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, cancel order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </SectionCard>
  )
}

export default function PaymentGroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const groupOrders = useMemo(
    () => orders.filter((o) => o.bookingGroupId === groupId),
    [orders, groupId],
  )
  useOrdersLiveSync({
    enabled: Boolean(groupId),
    intervalMs: 3_000,
  })
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
