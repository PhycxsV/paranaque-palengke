import { HandCoins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { OfferStatusBadge } from '@/components/shared/OfferStatusBadge'
import { useOfferStore } from '@/stores/offer-store'
import { useVendorStore } from '@/stores/vendor-store'
import { formatPeso, formatDateTime } from '@/lib/utils'

export default function AdminOffersPage() {
  const offers = useOfferStore((s) => s.offers)
  const vendors = useVendorStore((s) => s.vendors)

  const getVendorName = (vendorId: string) =>
    vendors.find((v) => v.id === vendorId)?.name ?? vendorId

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-deep">
          All Offers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Monitor marketplace offers (read-only)
        </p>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No offers yet"
          description="Offer negotiations will appear here once customers make them."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-warm-white text-left">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Product
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Customer
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Vendor
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Qty
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Standard
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Proposed
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-deep">
                  Counter
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-primary-deep">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr
                  key={offer.id}
                  className="border-b border-border last:border-0 hover:bg-warm-white/50"
                >
                  <td className="px-4 py-3 font-medium">
                    {offer.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {offer.customerLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {getVendorName(offer.vendorId)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {offer.quantity} {offer.unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                    {formatPeso(offer.standardUnitPriceSnapshot)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    {formatPeso(offer.proposedUnitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {offer.counterUnitPrice != null
                      ? formatPeso(offer.counterUnitPrice)
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <OfferStatusBadge status={offer.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {formatDateTime(offer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {offers.length > 0 && (
        <div className="space-y-3 sm:hidden">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary-deep">
                      {offer.productName}
                    </p>
                    <p className="text-xs text-muted">
                      {offer.customerLabel} → {getVendorName(offer.vendorId)}
                    </p>
                  </div>
                  <OfferStatusBadge status={offer.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>
                    Qty: {offer.quantity} {offer.unit}
                  </span>
                  <span>
                    Proposed: {formatPeso(offer.proposedUnitPrice)}
                  </span>
                  {offer.counterUnitPrice != null && (
                    <span>
                      Counter: {formatPeso(offer.counterUnitPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {formatDateTime(offer.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
