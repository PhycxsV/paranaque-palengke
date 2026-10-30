import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ProductImage } from '@/components/shared/ProductImage'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { useCartStore } from '@/stores/cart-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useOrderStore } from '@/stores/order-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { DELIVERY_FEE } from '@/constants'
import {
  resolveCartUnitPrice,
  calculateCartTotalWithPricing,
  groupCartItemsByVendor,
} from '@/lib/pricing'
import { formatPeso } from '@/lib/utils'
import type { CheckoutFormInput } from '@/types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const createCheckoutOrders = useOrderStore((s) => s.createCheckoutOrders)
  const commodities = useCommodityStore((s) => s.commodities)
  const allOffers = useOfferStore((s) => s.offers)

  const [form, setForm] = useState<CheckoutFormInput>({
    customerName: '',
    contactNumber: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const groups = useMemo(
    () => groupCartItemsByVendor(items, products),
    [items, products],
  )
  const vendorCount = groups.size || 1
  const deliveryShare = Number((DELIVERY_FEE / vendorCount).toFixed(2))
  const subtotal = calculateCartTotalWithPricing(
    items,
    products,
    commodities,
    allOffers,
  )
  const total = subtotal + DELIVERY_FEE

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/customer/cart', { replace: true })
    }
  }, [items.length, navigate, submitting])

  if (items.length === 0 && !submitting) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!form.customerName.trim()) {
      toast.error('Please enter your name.')
      return
    }
    if (!form.contactNumber.trim()) {
      toast.error('Please enter your contact number.')
      return
    }

    setSubmitting(true)

    const result = createCheckoutOrders({
      items,
      products,
      commodities,
      offers: allOffers,
      vendors,
      customer: form,
    })

    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }

    clearCart()
    toast.success(
      result.orders.length > 1
        ? `Order placed across ${result.orders.length} vendors — complete each QR payment.`
        : 'Order placed! Complete your demo payment.',
    )
    navigate(`/customer/payment/group/${result.checkoutGroupId}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/customer/cart">
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
      </Button>

      <h1 className="text-2xl font-extrabold text-primary-deep">Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        {vendorCount} vendor{vendorCount === 1 ? '' : 's'} · one QRPH code each
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">
            Your Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="Juan dela Cruz"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={form.contactNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactNumber: e.target.value }))
                }
                placeholder="09XX XXX XXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Special instructions..."
                rows={3}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary-deep">Order by vendor</h2>
          {[...groups.entries()].map(([vendorId, vendorItems], index) => {
            const vendor = vendors.find((v) => v.id === vendorId)
            const vendorSubtotal = calculateCartTotalWithPricing(
              vendorItems,
              products,
              commodities,
              allOffers,
            )
            const fee =
              deliveryShare +
              (index === 0
                ? Number(
                    (DELIVERY_FEE - deliveryShare * vendorCount).toFixed(2),
                  )
                : 0)
            const vendorTotal = vendorSubtotal + fee

            return (
              <div
                key={vendorId}
                className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
              >
                <p className="font-bold text-primary-deep">
                  {vendor?.name ?? 'Vendor'}
                </p>
                <div className="mt-3 divide-y divide-border">
                  {vendorItems.map((item) => {
                    const product = products.find((p) => p.id === item.productId)
                    if (!product) return null
                    const offer = item.acceptedOfferId
                      ? allOffers.find((o) => o.id === item.acceptedOfferId)
                      : undefined
                    const pricing = resolveCartUnitPrice({
                      product,
                      quantity: item.quantity,
                      commodities,
                      offer,
                    })
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 py-3"
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 shrink-0 rounded-md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-primary-deep">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted">
                            {item.quantity} × {formatPeso(pricing.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-primary-deep">
                          {formatPeso(pricing.unitPrice * item.quantity)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between text-ink/80">
                    <span>Subtotal</span>
                    <span>{formatPeso(vendorSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink/80">
                    <span>Delivery share</span>
                    <span>{formatPeso(fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary-deep">
                    <span>Vendor total (QR amount)</span>
                    <span>{formatPeso(vendorTotal)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <DemoQrPlaceholder
                    label={vendor?.demoQrLabel ?? 'Demo QR'}
                    amountLabel={formatPeso(vendorTotal)}
                  />
                </div>
              </div>
            )
          })}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-50 p-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary-deep">
                QRPH only — one code per vendor
              </p>
              <p className="text-xs text-muted">
                Pay each vendor separately after placing the order. Confirmation
                and Keri delivery wait until all vendor payments are finalized.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-lg font-bold text-primary-deep">
            <span>Grand total</span>
            <span>{formatPeso(total)}</span>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Placing order...' : 'Place Order & Pay'}
        </Button>
      </form>
    </div>
  )
}
