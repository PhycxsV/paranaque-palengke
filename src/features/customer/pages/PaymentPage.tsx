import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to={`/customer/orders/${order.id}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to order
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-primary-deep">Payment</h1>
        <p className="mt-1 text-sm text-muted">
          Order <span className="font-mono font-medium">{order.id}</span>
        </p>
      </div>

      {/* Order overview */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Vendor</p>
            <p className="font-semibold text-primary-deep">{order.vendorName}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">Amount Due</span>
          <span className="text-xl font-bold text-primary">{formatPeso(order.total)}</span>
        </div>
      </div>

      {/* Status-specific content */}
      {isConfirmed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
          <h2 className="text-lg font-bold text-emerald-800">Payment Confirmed</h2>
          <p className="mt-2 text-sm text-emerald-700">
            Salamat! The vendor has confirmed your demo payment.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to={`/customer/orders/${order.id}`}>View order details</Link>
          </Button>
        </div>
      )}

      {isAwaitingConfirmation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Clock className="mx-auto mb-3 h-12 w-12 text-amber-600" />
          <h2 className="text-lg font-bold text-amber-800">Awaiting Vendor Confirmation</h2>
          <p className="mt-2 text-sm text-amber-700">
            Your demo payment has been submitted. The vendor will verify it shortly.
          </p>
          {order.transactionReference && (
            <p className="mt-2 text-xs text-amber-600">
              Reference: <span className="font-mono">{order.transactionReference}</span>
            </p>
          )}
          <Button asChild className="mt-4" variant="secondary">
            <Link to={`/customer/orders/${order.id}`}>View order details</Link>
          </Button>
        </div>
      )}

      {canPay && (
        <>
          {order.status === 'payment_rejected' && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold text-red-800">Payment Rejected</p>
                  <p className="mt-1 text-sm text-red-700">
                    The vendor could not verify your previous payment. Please resubmit with
                    correct details.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* QR code */}
            <DemoQrPlaceholder
              label={vendor?.demoQrLabel ?? 'Demo QR Payment'}
              amountLabel={formatPeso(order.total)}
            />

            <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
              <h2 className="mb-3 font-bold text-primary-deep">How to pay (demo)</h2>
              <ol className="list-inside list-decimal space-y-2 text-sm text-ink/80">
                <li>Scan the demo QR code above (simulated — no real money involved).</li>
                <li>Optionally enter a transaction reference below.</li>
                <li>Click &quot;I&apos;ve Paid&quot; to submit your demo payment.</li>
                <li>Wait for the vendor to confirm the payment in the vendor portal.</li>
              </ol>
            </div>

            <div>
              <Label htmlFor="transactionRef">Transaction Reference (optional)</Label>
              <Input
                id="transactionRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. DEMO-REF-12345"
                className="mt-1"
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
          </div>
        </>
      )}
    </div>
  )
}
