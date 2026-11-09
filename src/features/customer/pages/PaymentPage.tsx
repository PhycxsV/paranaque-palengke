import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Clock, ListChecks } from 'lucide-react'
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

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const submitDemoPayment = useOrderStore((s) => s.submitDemoPayment)
  const vendors = useVendorStore((s) => s.vendors)

  const [transactionRef, setTransactionRef] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const order = orders.find((o) => o.id === orderId)
  const vendor = order ? vendors.find((v) => v.id === order.vendorId) : undefined

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={Clock}
          title="Order not found"
          description="This order may not exist or has been removed."
          actionLabel="View my orders"
          onAction={() => navigate('/customer/orders')}
        />
      </div>
    )
  }

  const canPay = order.status === 'pending_payment' || order.status === 'payment_rejected'
  const isAwaitingConfirmation = order.status === 'awaiting_vendor_confirmation'
  const isConfirmed = order.status === 'confirmed'

  const handleSubmitPayment = () => {
    setSubmitting(true)
    const result = submitDemoPayment(order.id, transactionRef)
    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }
    toast.success('Demo payment submitted! Waiting for vendor confirmation.')
    navigate(`/customer/orders/${order.id}`)
  }

  const viewOrder = (
    <Button asChild variant="outline">
      <Link to={`/customer/orders/${order.id}`}>View order details</Link>
    </Button>
  )

  return (
    <>
      <PageHeader
        width="narrow"
        eyebrow="Payment"
        title="Payment"
        back={{ to: `/customer/orders/${order.id}`, label: 'Back to order' }}
        description={
          <>
            Order <span className="font-mono font-semibold">{order.id}</span>
          </>
        }
      >
        <CheckoutSteps current={isConfirmed ? 3 : 2} />
      </PageHeader>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        {/* Order overview */}
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Vendor
              </p>
              <p className="font-display text-lg font-bold text-primary-deep">
                {order.vendorName}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-50/70 px-4 py-3">
            <span className="text-sm text-muted">Amount due</span>
            <span className="font-display text-2xl font-extrabold text-primary">
              {formatPeso(order.total)}
            </span>
          </div>
        </SectionCard>

        {isConfirmed && (
          <div className="space-y-6">
            <Notice
              tone="success"
              layout="panel"
              title="Payment Confirmed"
              action={viewOrder}
            >
              Salamat! The vendor has confirmed your demo payment. Keri delivery
              milestones are below.
            </Notice>
            <DeliveryMilestoneTracker
              deliveryStatus={order.deliveryStatus ?? 'awaiting_pickup'}
            />
          </div>
        )}

        {isAwaitingConfirmation && (
          <Notice
            tone="pending"
            layout="panel"
            title="Awaiting Vendor Confirmation"
            action={viewOrder}
          >
            Your demo payment has been submitted. The vendor will verify it shortly.
            {order.transactionReference && (
              <span className="mt-2 block text-xs">
                Reference: <span className="font-mono">{order.transactionReference}</span>
              </span>
            )}
          </Notice>
        )}

        {canPay && (
          <>
            {order.status === 'payment_rejected' && (
              <Notice tone="danger" title="Payment Rejected">
                The vendor could not verify your previous payment. Please resubmit
                with correct details.
              </Notice>
            )}

            <DemoQrPlaceholder
              label={vendor?.demoQrLabel ?? 'Demo QR Payment'}
              amountLabel={formatPeso(order.total)}
            />

            <SectionCard title="How to pay (demo)" icon={ListChecks}>
              <ol className="space-y-3 text-sm text-ink/80">
                {[
                  'Scan the demo QR code above (simulated — no real money involved).',
                  'Optionally enter a transaction reference below.',
                  'Click "I\'ve Paid" to submit your demo payment.',
                  'Wait for the vendor to confirm the payment in the vendor portal.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-extrabold text-primary-deep">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <div className="grid gap-1.5">
              <Label htmlFor="transactionRef">Transaction Reference (optional)</Label>
              <Input
                id="transactionRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. DEMO-REF-12345"
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : "I've Paid"}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
