import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOrderStore } from '@/stores/order-store'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Order } from '@/types'

export default function VendorOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const orders = useOrderStore((s) => s.orders)
  const confirmPayment = useOrderStore((s) => s.confirmPayment)
  const rejectPayment = useOrderStore((s) => s.rejectPayment)

  const [processing, setProcessing] = useState(false)

  const order = useMemo<Order | undefined>(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId],
  )

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/vendor/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <EmptyState
          icon={XCircle}
          title="Order not found"
          description={`No order with ID "${orderId ?? ''}" was found.`}
        />
      </div>
    )
  }

  if (order.vendorId !== activeVendorId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/vendor/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <EmptyState
          icon={XCircle}
          title="Access denied"
          description="This order belongs to a different vendor."
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/vendor/orders">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-primary-deep">
            {order.id}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted">Customer</p>
                <p className="text-sm font-semibold text-primary-deep">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Contact</p>
                <p className="text-sm font-semibold text-primary-deep">
                  {order.contactNumber}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Placed</p>
                <p className="text-sm text-ink">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Last updated</p>
                <p className="text-sm text-ink">
                  {formatDateTime(order.updatedAt)}
                </p>
              </div>
            </div>
            {order.notes ? (
              <div>
                <p className="text-xs font-medium text-muted">Notes</p>
                <p className="text-sm text-ink">{order.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted">
                Transaction reference
              </p>
              <p className="text-sm font-mono text-ink">
                {order.transactionReference ?? '—'}
              </p>
            </div>
            {order.paymentSubmittedAt ? (
              <div>
                <p className="text-xs font-medium text-muted">
                  Payment submitted
                </p>
                <p className="text-sm text-ink">
                  {formatDateTime(order.paymentSubmittedAt)}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium text-muted">Total</p>
              <p className="text-lg font-extrabold text-primary-deep">
                {formatPeso(order.total)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 py-3"
              >
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-deep">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatPeso(item.unitPrice)} / {item.unit} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-primary-deep">
                  {formatPeso(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-right">
            <p className="text-xs text-muted">
              Subtotal {formatPeso(order.subtotal)} · Delivery{' '}
              {formatPeso(order.deliveryFee ?? 0)}
            </p>
            <p className="text-xs text-muted">Order total</p>
            <p className="text-xl font-extrabold text-primary-deep">
              {formatPeso(order.total)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {canProcess ? (
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-5">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={processing}>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm payment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm payment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the order as confirmed. The customer will be
                    notified that their payment has been verified.
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
                <Button variant="destructive" disabled={processing}>
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
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted">
          {order.status === 'confirmed'
            ? 'This order has already been confirmed.'
            : order.status === 'payment_rejected'
              ? 'This payment was rejected. The customer may resubmit.'
              : 'This order is not yet ready for vendor confirmation.'}
        </p>
      )}
    </div>
  )
}
