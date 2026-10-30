import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MessageSquare, ShoppingCart, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import { useOfferStore } from '@/stores/offer-store'
import { useProductStore } from '@/stores/product-store'
import { useVendorStore } from '@/stores/vendor-store'
import { useAddToCart } from '@/hooks/useAddToCart'
import { getAcceptedOfferUnitPrice } from '@/lib/pricing'
import { OFFER_STATUS_LABELS } from '@/constants'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { OfferStatus } from '@/types'

type FilterTab = 'all' | OfferStatus

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'countered', label: 'Countered' },
  { value: 'counter_accepted', label: 'Counter Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'counter_declined', label: 'Declined' },
]

export default function CustomerOffersPage() {
  const offers = useOfferStore((s) => s.offers)
  const acceptCounter = useOfferStore((s) => s.acceptCounter)
  const declineCounter = useOfferStore((s) => s.declineCounter)
  const products = useProductStore((s) => s.products)
  const vendors = useVendorStore((s) => s.vendors)
  const { addToCart } = useAddToCart()

  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const filtered = useMemo(
    () =>
      activeTab === 'all'
        ? offers
        : offers.filter((o) => o.status === activeTab),
    [offers, activeTab],
  )

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

  const handleAddNegotiated = (offerId: string, productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) {
      toast.error('Product not found.')
      return
    }
    addToCart(product, quantity, offerId)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-primary-deep">My Offers</h1>
      <p className="mt-1 text-sm text-muted">
        Track your tawad / negotiation offers with vendors
      </p>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={activeTab === tab.value ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessageSquare}
            title="No offers found"
            description={
              activeTab === 'all'
                ? "You haven\u2019t submitted any offers yet. Browse products and tumawad!"
                : `No offers with status "${FILTER_TABS.find((t) => t.value === activeTab)?.label ?? activeTab}".`
            }
            actionLabel="Browse products"
            onAction={() => {
              window.location.href = '/customer/products'
            }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((offer) => {
            const product = products.find((p) => p.id === offer.productId)
            const vendor = vendors.find((v) => v.id === offer.vendorId)
            const accepted =
              offer.status === 'accepted' || offer.status === 'counter_accepted'
            const negotiatedPrice = getAcceptedOfferUnitPrice(offer)

            return (
              <div
                key={offer.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex gap-4">
                  {product && (
                    <Link to={`/customer/products/${product.id}`} className="shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={offer.productName}
                        className="h-16 w-16 rounded-lg"
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/customer/products/${offer.productId}`}
                        className="truncate font-semibold text-primary-deep hover:text-primary"
                      >
                        {offer.productName}
                      </Link>
                      <Badge
                        variant={
                          accepted
                            ? 'success'
                            : offer.status === 'rejected' ||
                                offer.status === 'counter_declined'
                              ? 'muted'
                              : 'secondary'
                        }
                      >
                        {OFFER_STATUS_LABELS[offer.status]}
                      </Badge>
                    </div>
                    {vendor && (
                      <p className="mt-0.5 text-xs text-muted">
                        Vendor: {vendor.name}
                      </p>
                    )}
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
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDateTime(offer.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {accepted && negotiatedPrice != null && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAddNegotiated(offer.id, offer.productId, offer.quantity)
                      }
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
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/customer/products/${offer.productId}`}>
                      View product
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
