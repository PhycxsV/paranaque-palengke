import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Store, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckoutSteps } from '@/components/shared/CheckoutSteps'
import { DemoQrPlaceholder } from '@/components/shared/DemoQrPlaceholder'
import { Notice } from '@/components/shared/Notice'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { SectionCard } from '@/components/shared/SectionCard'
import { useCartStore } from '@/stores/cart-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useOrderStore } from '@/stores/order-store'
import { useCommodityStore } from '@/stores/commodity-store'
import {
  profileToCheckoutForm,
  useCustomerProfileStore,
} from '@/stores/customer-profile-store'
import { useOfferStore } from '@/stores/offer-store'
import { DELIVERY_FEE, DELIVERY_FEE_NOTE } from '@/constants'
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
  const profile = useCustomerProfileStore((s) => s.profile)
  const saveFromCheckout = useCustomerProfileStore((s) => s.saveFromCheckout)

  const [form, setForm] = useState<CheckoutFormInput>(() =>
    profileToCheckoutForm(profile),
  )
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
    if (!form.deliveryAddress.trim()) {
      toast.error('Please enter your drop-off address.')
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

    // Keep the profile in sync so the next checkout is prefilled.
    saveFromCheckout(form)
    clearCart()
    toast.success(
      result.orders.length > 1
        ? `Order placed across ${result.orders.length} vendors — complete each QR payment.`
        : 'Order placed! Complete your demo payment.',
    )
    navigate(`/customer/payment/group/${result.bookingGroupId}`)
  }

  return (
    <>
      <PageHeader
        width="medium"
        eyebrow="Almost there"
        title="Checkout"
        back={{ to: '/customer/cart', label: 'Back to cart' }}
        description={`${vendorCount} vendor${vendorCount === 1 ? '' : 's'} · one QRPH code each`}
      >
        <CheckoutSteps current={1} />
      </PageHeader>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]"
      >
        <div className="space-y-6">
          <SectionCard
            title="Your information"
            icon={UserRound}
            action={
              <Link
                to="/customer/profile"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit profile
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-1.5">
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
              <div className="grid gap-1.5">
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
              <div className="grid gap-1.5">
                <Label htmlFor="deliveryAddress">Drop-off address *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
                  }
                  placeholder="House/unit no., street, barangay, landmark…"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted">
                  Where Keri should deliver your order.
                </p>
              </div>
              <div className="grid gap-1.5">
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
          </SectionCard>

          <div className="space-y-5">
            <h2 className="font-display text-xl font-extrabold text-primary-deep">
              Order by vendor
            </h2>
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
                <SectionCard
                  key={vendorId}
                  title={vendor?.name ?? 'Vendor'}
                  icon={Store}
                >
                  <div className="divide-y divide-border">
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
                          className="flex items-center gap-3 py-3 first:pt-0"
                        >
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-xl"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-primary-deep">
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
                  <div className="mt-2 space-y-1.5 rounded-xl bg-primary-50/60 p-4 text-sm">
                    <div className="flex justify-between text-ink/80">
                      <span>Subtotal</span>
                      <span>{formatPeso(vendorSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-ink/80">
                      <span>Delivery share (placeholder)</span>
                      <span>{formatPeso(fee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-primary/20 pt-2 font-bold text-primary-deep">
                      <span>Vendor total (QR amount)</span>
                      <span>{formatPeso(vendorTotal)}</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <DemoQrPlaceholder
                      label={vendor?.demoQrLabel ?? 'Demo QR'}
                      amountLabel={formatPeso(vendorTotal)}
                    />
                  </div>
                </SectionCard>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
            <h2 className="border-b border-border bg-gradient-to-r from-primary-50/70 to-transparent px-5 py-3.5 font-bold text-primary-deep">
              Payment summary
            </h2>
            <div className="space-y-3 p-5">
              <div className="flex justify-between text-sm text-ink/80">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink/80">
                <span>Delivery (placeholder)</span>
                <span className="font-semibold">{formatPeso(DELIVERY_FEE)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                <span className="font-bold text-primary-deep">Grand total</span>
                <span className="font-display text-2xl font-extrabold text-primary">
                  {formatPeso(total)}
                </span>
              </div>
              <p className="text-xs text-muted">{DELIVERY_FEE_NOTE}</p>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Placing order...' : 'Place Order & Pay'}
              </Button>
            </div>
          </div>
          <Notice tone="info" title="QRPH only — one code per vendor">
            Pay each vendor separately after placing the order. All vendor orders
            share one booking group for Keri. Confirmation and delivery wait until
            the whole group is ready.
          </Notice>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <CreditCard className="h-3.5 w-3.5" />
            Demo payment — no real money is moved.
          </p>
        </aside>
      </form>
    </>
  )
}
