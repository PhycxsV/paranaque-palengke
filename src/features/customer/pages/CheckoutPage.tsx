import { useEffect, useState, type FormEvent } from 'react'
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
import { resolveCartUnitPrice, calculateCartTotalWithPricing } from '@/lib/pricing'
import { formatPeso } from '@/lib/utils'
import type { CheckoutFormInput } from '@/types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, vendorId, clearCart } = useCartStore()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const createOrder = useOrderStore((s) => s.createOrder)
  const commodities = useCommodityStore((s) => s.commodities)
  const allOffers = useOfferStore((s) => s.offers)

  const [form, setForm] = useState<CheckoutFormInput>({
    customerName: '',
    contactNumber: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const vendor = vendors.find((v) => v.id === vendorId)

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/customer/cart', { replace: true })
    }
  }, [items.length, navigate, submitting])

  if (items.length === 0 && !submitting) return null

  const cartLines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    const offer = item.acceptedOfferId
      ? allOffers.find((o) => o.id === item.acceptedOfferId)
      : undefined
    const pricing = product
      ? resolveCartUnitPrice({ product, quantity: item.quantity, commodities, offer })
      : null
    return { ...item, product, pricing }
  })

  const subtotal = calculateCartTotalWithPricing(items, products, commodities, allOffers)

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
    if (!vendorId || !vendor) {
      toast.error('Vendor information is missing.')
      return
    }

    setSubmitting(true)

    const result = createOrder({
      vendorId,
      vendorName: vendor.name,
      items,
      products,
      commodities,
      offers: allOffers,
      customer: form,
    })

    if (!result.ok) {
      toast.error(result.message)
      setSubmitting(false)
      return
    }

    clearCart()
    toast.success('Order placed! Complete your demo payment.')
    navigate(`/customer/payment/${result.order.id}`)
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
      {vendor && (
        <p className="mt-1 text-sm text-muted">
          Ordering from{' '}
          <span className="font-medium text-primary">{vendor.name}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Customer info */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">Your Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="Juan dela Cruz"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={form.contactNumber}
                onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                placeholder="09XX XXX XXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Special instructions for the vendor..."
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">Order Summary</h2>
          <div className="divide-y divide-border">
            {cartLines.map((line) => {
              if (!line.product || !line.pricing) return null
              const { product, pricing } = line
              const lineTotal = pricing.unitPrice * line.quantity
              const isNegotiated = pricing.pricingSource === 'negotiated'

              return (
                <div key={line.productId} className="flex items-center gap-3 py-3">
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
                      {line.quantity} × {formatPeso(pricing.unitPrice)}
                      {isNegotiated && (
                        <span className="ml-1 text-emerald-600">
                          (negotiated
                          <span className="ml-1 line-through">
                            {formatPeso(pricing.standardUnitPrice)}
                          </span>
                          )
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-primary-deep">
                    {formatPeso(lineTotal)}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-lg font-bold text-primary-deep">
            <span>Total</span>
            <span>{formatPeso(subtotal)}</span>
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-bold text-primary-deep">Payment Method</h2>
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-50 p-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary-deep">Demo QR Payment</p>
              <p className="text-xs text-muted">
                You will scan a demo QR code after placing the order.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <DemoQrPlaceholder
              label={vendor?.demoQrLabel ?? 'Demo QR'}
              amountLabel={formatPeso(subtotal)}
            />
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Placing order...' : 'Place Order & Pay'}
        </Button>
      </form>
    </div>
  )
}
