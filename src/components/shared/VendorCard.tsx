import { Link } from 'react-router-dom'
import { Clock, MapPin, Star } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import {
  formatVendorTime,
  isVendorAcceptingOrders,
} from '@/lib/vendor-hours'
import type { Vendor } from '@/types'

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : '—'
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const accepting = isVendorAcceptingOrders(vendor)
  const cardInner = (
    <>
      <ProductImage
        src={vendor.imageUrl}
        alt={vendor.name}
        className="aspect-[16/10]"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-bold ${accepting ? 'text-primary-deep group-hover:text-primary' : 'text-muted'}`}
          >
            {vendor.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gold/15 px-2 py-0.5 text-xs font-semibold text-primary-deep">
              <Star className="h-3 w-3 fill-current text-gold" />
              {formatRating(vendor.rating)}
            </span>
            {!accepting && (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Past cut-off
              </span>
            )}
          </div>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" />
          {vendor.location}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3 w-3" />
          Orders until {formatVendorTime(vendor.cutoffTime)}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-ink/70">{vendor.description}</p>
      </div>
    </>
  )

  if (!accepting) {
    return (
      <div
        className="overflow-hidden rounded-xl border border-border bg-surface opacity-60 shadow-[var(--shadow-soft)]"
        aria-disabled
      >
        {cardInner}
      </div>
    )
  }

  return (
    <Link
      to={`/customer/stores/${vendor.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {cardInner}
    </Link>
  )
}
