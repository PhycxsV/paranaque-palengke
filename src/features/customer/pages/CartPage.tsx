import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import { useCartStore } from '@/stores/cart-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { DELIVERY_FEE } from '@/constants'
import {
  resolveCartUnitPrice,
  calculateCartTotalWithPricing,
  groupCartItemsByVendor,
} from '@/lib/pricing'
import { formatPeso } from '@/lib/utils'

export default function CartPage() {
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
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the palengke and add fresh products to your cart."
          actionLabel="Browse products"
          onAction={() => {
            window.location.href = '/customer/products'
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-primary-deep">Your Cart</h1>
      <p className="mt-1 text-sm text-muted">
        {vendorCount} vendor{vendorCount === 1 ? '' : 's'} · multi-vendor checkout
        supported
      </p>

      <div className="mt-6 space-y-5">
        {[...groups.entries()].map(([vendorId, vendorItems]) => {
          const vendor = vendors.find((v) => v.id === vendorId)
          return (
            <section
              key={vendorId}
              className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]"
            >
              <div className="border-b border-border bg-primary-50/40 px-4 py-3">
                <p className="font-bold text-primary-deep">
                  {vendor?.name ?? 'Vendor'}
                </p>
                <p className="text-xs text-muted">
                  Delivery share ≈ {formatPeso(deliveryShare)} (₱{DELIVERY_FEE} ÷{' '}
                  {vendorCount})
                </p>
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
                    <div key={item.productId} className="flex gap-4 p-4">
                      <Link
                        to={`/customer/products/${product.id}`}
                        className="shrink-0"
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-20 w-20 rounded-lg"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link
                          to={`/customer/products/${product.id}`}
                          className="truncate font-semibold text-primary-deep hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <p className="text-sm text-muted">
                          {formatPeso(pricing.unitPrice)} / {product.unit}
                        </p>
                        <div className="mt-auto flex items-center gap-3">
                          <div className="flex items-center gap-1 rounded-md border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setQuantity(item.productId, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="min-w-[2rem] text-center text-sm font-bold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setQuantity(
                                  item.productId,
                                  Math.min(product.stock, item.quantity + 1),
                                )
                              }
                              disabled={item.quantity >= product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-primary-deep">
                        {formatPeso(lineTotal)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-ink/80">
            <span>Subtotal</span>
            <span>{formatPeso(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-ink/80">
            <span>
              Delivery fee (split across {vendorCount} vendor
              {vendorCount === 1 ? '' : 's'})
            </span>
            <span>{formatPeso(DELIVERY_FEE)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-primary-deep">
            <span>Total</span>
            <span>{formatPeso(total)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          At checkout you will see a separate QRPH code per vendor. Each vendor
          total includes their share of the ₱{DELIVERY_FEE} Keri delivery fee.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1" size="lg">
            <Link to="/customer/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/customer/products">Continue Shopping</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-red-500 hover:text-red-600"
          onClick={clearCart}
        >
          <Trash2 className="h-4 w-4" />
          Clear cart
        </Button>
      </div>
    </div>
  )
}
