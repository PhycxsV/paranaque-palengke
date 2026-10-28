import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  MessageSquare,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ProductCard } from '@/components/shared/ProductCard'
import { ProductImage } from '@/components/shared/ProductImage'
import { VendorConflictDialog } from '@/components/shared/VendorConflictDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useCommodityStore } from '@/stores/commodity-store'
import { useOfferStore } from '@/stores/offer-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import { getStandardPrice, getAcceptedOfferUnitPrice } from '@/lib/pricing'
import { formatVendorTime, isVendorAcceptingOrders } from '@/lib/vendor-hours'
import { PRICE_DISCLAIMER, OFFER_STATUS_LABELS } from '@/constants'
import { formatPeso } from '@/lib/utils'
import type { OfferFormInput } from '@/types'

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const commodities = useCommodityStore((s) => s.commodities)
  const offers = useOfferStore((s) => s.offers)
  const createOffer = useOfferStore((s) => s.createOffer)
  const acceptCounter = useOfferStore((s) => s.acceptCounter)
  const declineCounter = useOfferStore((s) => s.declineCounter)
  const { addToCart, conflictOpen, currentVendorName, newVendorName, keepCurrentCart, replaceCart } =
    useAddToCart()

  const [quantity, setQuantity] = useState(1)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerQty, setOfferQty] = useState(1)
  const [offerNote, setOfferNote] = useState('')
  const [showOfferForm, setShowOfferForm] = useState(false)

  const product = products.find((p) => p.id === productId && !p.isArchived)
  const vendor = product ? vendors.find((v) => v.id === product.vendorId) : undefined
  const standardPrice = product ? getStandardPrice(product, commodities) : 0

  const productOffers = product
    ? offers.filter((o) => o.productId === product.id)
    : []

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingCart}
          title="Product not found"
          description="This product may have been removed or doesn't exist."
          actionLabel="Browse products"
          onAction={() => {
            window.location.href = '/customer/products'
          }}
        />
      </div>
    )
  }

  const vendorClosed = vendor ? !isVendorAcceptingOrders(vendor) : false
  const unavailable =
    !product.isAvailable || product.stock <= 0 || vendorClosed

  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        !p.isArchived &&
        p.isAvailable &&
        (p.category === product.category || p.vendorId === product.vendorId),
    )
    .slice(0, 4)

  const handleAdd = () => {
    addToCart(product, quantity)
    setQuantity(1)
  }

  const handleSubmitOffer = (e: FormEvent) => {
    e.preventDefault()
    const proposedUnitPrice = parseFloat(offerPrice)
    if (!proposedUnitPrice || proposedUnitPrice <= 0) {
      toast.error('Enter a valid offer price.')
      return
    }
    const form: OfferFormInput = {
      productId: product.id,
      quantity: offerQty,
      proposedUnitPrice,
      customerLabel: 'Demo Customer',
      note: offerNote.trim() || undefined,
    }
    const result = createOffer({ form, product, commodities })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Offer submitted! Wait for the vendor to respond.')
    setOfferPrice('')
    setOfferQty(1)
    setOfferNote('')
    setShowOfferForm(false)
  }

  const handleAddNegotiated = (offerId: string, offerQuantity: number) => {
    addToCart(product, offerQuantity, offerId)
  }

  const handleAcceptCounter = (offerId: string) => {
    const result = acceptCounter(offerId)
    if (result.ok) {
      toast.success('Counteroffer accepted!')
    } else {
      toast.error(result.message)
    }
  }

  const handleDeclineCounter = (offerId: string) => {
    const result = declineCounter(offerId)
    if (result.ok) {
      toast.info('Counteroffer declined.')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/customer/products">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full overflow-hidden rounded-xl"
        />

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              <Badge variant={unavailable ? 'muted' : 'success'}>
                {vendorClosed
                  ? `Past cut-off (${vendor ? formatVendorTime(vendor.cutoffTime) : ''})`
                  : unavailable
                    ? 'Unavailable'
                    : `${product.stock} ${product.unit} in stock`}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-primary-deep sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-3xl font-bold text-primary">
              {formatPeso(standardPrice)}
              <span className="ml-1 text-base font-medium text-muted">
                /{product.unit}
              </span>
            </p>
            <p className="mt-1 text-xs font-medium text-muted">LGU standard price</p>
            <p className="mt-1 text-[11px] italic text-muted">{PRICE_DISCLAIMER}</p>
          </div>

          <p className="text-sm leading-relaxed text-ink/80">{product.description}</p>

          {vendor && (
            <Link
              to={`/customer/stores/${vendor.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Store className="h-4 w-4" />
              {vendor.name}
            </Link>
          )}

          {/* Quantity + Add to Cart */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-lg border border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={unavailable}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2.5rem] text-center text-sm font-bold">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={unavailable || quantity >= product.stock}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="flex-1"
              size="lg"
              disabled={unavailable}
              onClick={handleAdd}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to cart
            </Button>
          </div>

          {/* Tawad / Offer Section */}
          <div className="mt-6 rounded-xl border border-border bg-warm-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-primary-deep">
                <MessageSquare className="h-5 w-5" />
                Make an Offer / Tumawad
              </h2>
              {!showOfferForm && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={unavailable}
                  onClick={() => setShowOfferForm(true)}
                >
                  New Offer
                </Button>
              )}
            </div>
            <p className="mb-4 text-xs text-muted">
              Propose a lower price for bulk or negotiated deals. The vendor can accept,
              reject, or counter your offer.
            </p>

            {showOfferForm && (
              <form onSubmit={handleSubmitOffer} className="space-y-4 rounded-lg border border-border bg-surface p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="offer-price">Your Offer Price (₱/{product.unit})</Label>
                    <Input
                      id="offer-price"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder={`Less than ${formatPeso(standardPrice)}`}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="offer-qty">Quantity ({product.unit})</Label>
                    <Input
                      id="offer-qty"
                      type="number"
                      min={1}
                      max={product.stock}
                      value={offerQty}
                      onChange={(e) => setOfferQty(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="offer-note">Note (optional)</Label>
                  <Textarea
                    id="offer-note"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder="Reason for your offer..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Submit Offer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOfferForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Existing offers for this product */}
            {productOffers.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-primary-deep">Your Offers</h3>
                {productOffers.map((offer) => {
                  const accepted = offer.status === 'accepted' || offer.status === 'counter_accepted'
                  const negotiatedPrice = getAcceptedOfferUnitPrice(offer)

                  return (
                    <div
                      key={offer.id}
                      className="rounded-lg border border-border bg-surface p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            accepted
                              ? 'success'
                              : offer.status === 'rejected' || offer.status === 'counter_declined'
                                ? 'muted'
                                : 'secondary'
                          }
                        >
                          {OFFER_STATUS_LABELS[offer.status]}
                        </Badge>
                        <span className="text-xs text-muted">{offer.id}</span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm">
                        <p>
                          <span className="text-muted">Proposed:</span>{' '}
                          <span className="font-semibold">
                            {formatPeso(offer.proposedUnitPrice)}/{offer.unit}
                          </span>{' '}
                          × {offer.quantity} {offer.unit}
                        </p>
                        <p>
                          <span className="text-muted">Standard:</span>{' '}
                          {formatPeso(offer.standardUnitPriceSnapshot)}/{offer.unit}
                        </p>
                        {offer.counterUnitPrice != null && (
                          <p>
                            <span className="text-muted">Counter:</span>{' '}
                            <span className="font-semibold text-amber-700">
                              {formatPeso(offer.counterUnitPrice)}/{offer.unit}
                            </span>
                          </p>
                        )}
                        {offer.note && (
                          <p className="text-xs text-muted">Note: {offer.note}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {accepted && negotiatedPrice != null && (
                          <Button
                            size="sm"
                            onClick={() => handleAddNegotiated(offer.id, offer.quantity)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add to cart at {formatPeso(negotiatedPrice)}
                          </Button>
                        )}
                        {offer.status === 'countered' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptCounter(offer.id)}
                            >
                              <Check className="h-4 w-4" />
                              Accept Counter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineCounter(offer.id)}
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-extrabold text-primary-deep">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                vendor={vendors.find((v) => v.id === p.vendorId)}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      <VendorConflictDialog
        open={conflictOpen}
        currentVendorName={currentVendorName}
        newVendorName={newVendorName}
        onKeep={keepCurrentCart}
        onReplace={replaceCart}
      />
    </div>
  )
}
