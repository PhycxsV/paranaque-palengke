import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShoppingCart, Store, Trash2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CheckoutSteps } from '@/components/shared/CheckoutSteps'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProductImage } from '@/components/shared/ProductImage'
import { QuantityStepper } from '@/components/shared/QuantityStepper'
import { useCartStore } from '@/stores/cart-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { DELIVERY_FEE, DELIVERY_FEE_NOTE } from '@/constants'
import {
  resolveCartUnitPrice,
  calculateCartTotalWithPricing,
  groupCartItemsByVendor,
} from '@/lib/pricing'
import { formatPeso } from '@/lib/utils'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, setQuantity, removeItem, clearCart } = useCartStore()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const commodities = useCommodityStore((s) => s.commodities)
  const allOffers = useOfferStore((s) => s.offers)

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

  if (items.length === 0) {
    return (
      <>
        <PageHeader width="default" eyebrow="Your cart" title="Your Cart">
          <CheckoutSteps current={0} />
        </PageHeader>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Browse the palengke and add fresh products to your cart."
            actionLabel="Browse products"
            onAction={() => navigate('/customer/products')}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        width="medium"
        eyebrow="Your cart"
        title="Your Cart"
        description={`${vendorCount} vendor${vendorCount === 1 ? '' : 's'} · multi-vendor checkout supported`}
      >
        <CheckoutSteps current={0} />
      </PageHeader>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {[...groups.entries()].map(([vendorId, vendorItems]) => {
            const vendor = vendors.find((v) => v.id === vendorId)
            return (
              <section
                key={vendorId}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary-50/70 to-transparent px-4 py-3.5 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-primary/10">
                    <Store className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-primary-deep">
                      {vendor?.name ?? 'Vendor'}
                    </p>
                    <p className="text-xs text-muted">
                      Delivery share ≈ {formatPeso(deliveryShare)} (placeholder ₱
                      {DELIVERY_FEE} ÷ {vendorCount})
                    </p>
                  </div>
                </div>
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
                    const lineTotal = pricing.unitPrice * item.quantity

                    return (
                      <div key={item.productId} className="flex gap-4 p-4 sm:p-5">
                        <Link
                          to={`/customer/products/${product.id}`}
                          className="shrink-0"
                        >
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-20 w-20 rounded-xl sm:h-24 sm:w-24"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              to={`/customer/products/${product.id}`}
                              className="line-clamp-2 font-display font-bold text-primary-deep hover:text-primary"
                            >
                              {product.name}
                            </Link>
                            <p className="shrink-0 font-display text-base font-extrabold text-primary">
                              {formatPeso(lineTotal)}
                            </p>
                          </div>
                          <p className="text-sm text-muted">
                            {formatPeso(pricing.unitPrice)} / {product.unit}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              min={0}
                              max={product.stock}
                              onChange={(next) => setQuantity(item.productId, next)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={clearCart}
          >
            <Trash2 className="h-4 w-4" />
            Clear cart
          </Button>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
            <h2 className="border-b border-border bg-gradient-to-r from-primary-50/70 to-transparent px-5 py-3.5 font-bold text-primary-deep">
              Order summary
            </h2>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-sm text-ink/80">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPeso(subtotal)}</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm text-ink/80">
                <span className="flex items-center gap-1.5">
                  <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Delivery fee (placeholder)
                </span>
                <span className="font-semibold">{formatPeso(DELIVERY_FEE)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                <span className="font-bold text-primary-deep">Total</span>
                <span className="font-display text-2xl font-extrabold text-primary">
                  {formatPeso(total)}
                </span>
              </div>
              <p className="rounded-xl bg-primary-50 p-3 text-xs leading-relaxed text-muted">
                {DELIVERY_FEE_NOTE} At checkout you get a separate QR per vendor;
                each total includes their share of the placeholder Keri fee. All
                vendor orders in this checkout share one booking group for Keri.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/customer/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/customer/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
