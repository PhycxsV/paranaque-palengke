import { useMemo, useState } from 'react'
import { Check, MessageSquare, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import { useDemoSessionStore } from '@/stores/demo-session-store'
import { useOfferStore } from '@/stores/offer-store'
import { useProductStore } from '@/stores/product-store'
import { OFFER_STATUS_LABELS } from '@/constants'
import { formatPeso, formatDateTime } from '@/lib/utils'
import type { Offer, OfferStatus } from '@/types'

type FilterTab = 'all' | OfferStatus

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'countered', label: 'Countered' },
  { value: 'counter_accepted', label: 'Counter Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'counter_declined', label: 'Counter Declined' },
]

export default function VendorOffersPage() {
  const activeVendorId = useDemoSessionStore((s) => s.activeVendorId)
  const getOffersByVendor = useOfferStore((s) => s.getOffersByVendor)
  const acceptOffer = useOfferStore((s) => s.acceptOffer)
  const rejectOffer = useOfferStore((s) => s.rejectOffer)
  const counterOffer = useOfferStore((s) => s.counterOffer)
  const products = useProductStore((s) => s.products)

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [counterTarget, setCounterTarget] = useState<Offer | null>(null)
  const [counterPrice, setCounterPrice] = useState('')

  const vendorOffers = useMemo(
    () => getOffersByVendor(activeVendorId),
    [getOffersByVendor, activeVendorId],
  )

  const filtered = useMemo(
    () =>
      activeTab === 'all'
        ? vendorOffers
        : vendorOffers.filter((o) => o.status === activeTab),
    [vendorOffers, activeTab],
  )

  const handleAccept = (offerId: string) => {
    const result = acceptOffer(offerId, activeVendorId)
    if (result.ok) {
      toast.success('Offer accepted')
    } else {
      toast.error(result.message)
    }
  }

  const handleReject = (offerId: string) => {
    const result = rejectOffer(offerId, activeVendorId)
    if (result.ok) {
      toast.info('Offer rejected')
    } else {
      toast.error(result.message)
    }
  }

  const openCounterDialog = (offer: Offer) => {
    setCounterTarget(offer)
    setCounterPrice('')
  }

  const handleSubmitCounter = () => {
    if (!counterTarget) return
    const price = parseFloat(counterPrice)
    if (!price || price <= 0) {
      toast.error('Enter a valid counter price.')
      return
    }
    const result = counterOffer(counterTarget.id, activeVendorId, price)
    if (result.ok) {
      toast.success('Counteroffer submitted')
      setCounterTarget(null)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">Offers</h1>
        <p className="mt-1 text-sm text-muted">
          Manage customer tawad / negotiation offers
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
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
        <EmptyState
          icon={MessageSquare}
          title="No offers found"
          description={
            activeTab === 'all'
              ? 'No customer offers yet. They will appear here when customers tumawad.'
              : `No offers with status "${FILTER_TABS.find((t) => t.value === activeTab)?.label ?? activeTab}".`
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-warm-white text-left">
                    <th className="px-4 py-3 font-semibold text-muted">Product</th>
                    <th className="px-4 py-3 font-semibold text-muted">Customer</th>
                    <th className="px-4 py-3 font-semibold text-muted">Proposed</th>
                    <th className="px-4 py-3 font-semibold text-muted">Standard</th>
                    <th className="px-4 py-3 font-semibold text-muted">Qty</th>
                    <th className="px-4 py-3 font-semibold text-muted">Status</th>
                    <th className="px-4 py-3 font-semibold text-muted">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((offer) => {
                    const product = products.find((p) => p.id === offer.productId)
                    return (
                      <tr key={offer.id} className="transition hover:bg-warm-white">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product && (
                              <ProductImage
                                src={product.imageUrl}
                                alt={offer.productName}
                                className="h-8 w-8 shrink-0 rounded"
                              />
                            )}
                            <span className="truncate font-medium text-primary-deep">
                              {offer.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{offer.customerLabel}</td>
                        <td className="px-4 py-3 font-semibold">
                          {formatPeso(offer.proposedUnitPrice)}/{offer.unit}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatPeso(offer.standardUnitPriceSnapshot)}/{offer.unit}
                        </td>
                        <td className="px-4 py-3">
                          {offer.quantity} {offer.unit}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              offer.status === 'accepted' ||
                              offer.status === 'counter_accepted'
                                ? 'success'
                                : offer.status === 'rejected' ||
                                    offer.status === 'counter_declined'
                                  ? 'muted'
                                  : 'secondary'
                            }
                          >
                            {OFFER_STATUS_LABELS[offer.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatDateTime(offer.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {offer.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAccept(offer.id)}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCounterDialog(offer)}
                              >
                                <MessageSquare className="h-4 w-4 text-amber-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(offer.id)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((offer) => {
              const product = products.find((p) => p.id === offer.productId)
              return (
                <Card key={offer.id} className="p-4">
                  <div className="flex gap-3">
                    {product && (
                      <ProductImage
                        src={product.imageUrl}
                        alt={offer.productName}
                        className="h-12 w-12 shrink-0 rounded-lg"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-primary-deep">
                          {offer.productName}
                        </p>
                        <Badge
                          variant={
                            offer.status === 'accepted' ||
                            offer.status === 'counter_accepted'
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
                      <p className="text-xs text-muted">
                        {offer.customerLabel} · {formatDateTime(offer.createdAt)}
                      </p>
                      <div className="mt-2 text-sm">
                        <p>
                          Proposed:{' '}
                          <span className="font-semibold">
                            {formatPeso(offer.proposedUnitPrice)}/{offer.unit}
                          </span>{' '}
                          × {offer.quantity}
                        </p>
                        <p className="text-muted">
                          Standard: {formatPeso(offer.standardUnitPriceSnapshot)}/
                          {offer.unit}
                        </p>
                        {offer.counterUnitPrice != null && (
                          <p className="text-amber-700">
                            Counter: {formatPeso(offer.counterUnitPrice)}/{offer.unit}
                          </p>
                        )}
                        {offer.note && (
                          <p className="text-xs text-muted">Note: {offer.note}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {offer.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button size="sm" onClick={() => handleAccept(offer.id)}>
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCounterDialog(offer)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Counter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(offer.id)}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Counter dialog */}
      <Dialog
        open={counterTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCounterTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Counteroffer</DialogTitle>
          </DialogHeader>
          {counterTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-warm-white p-3">
                <p className="text-sm font-semibold text-primary-deep">
                  {counterTarget.productName}
                </p>
                <p className="text-xs text-muted">
                  Customer proposed: {formatPeso(counterTarget.proposedUnitPrice)}/
                  {counterTarget.unit} × {counterTarget.quantity}
                </p>
                <p className="text-xs text-muted">
                  Standard: {formatPeso(counterTarget.standardUnitPriceSnapshot)}/
                  {counterTarget.unit}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="counter-price">
                  Your Counter Price (₱/{counterTarget.unit})
                </Label>
                <Input
                  id="counter-price"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder={`Between ${formatPeso(counterTarget.proposedUnitPrice)} and ${formatPeso(counterTarget.standardUnitPriceSnapshot)}`}
                />
                <p className="text-xs text-muted">
                  Must be below the LGU standard price.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmitCounter}>Submit Counter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
