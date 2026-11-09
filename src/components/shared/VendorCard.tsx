import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, MapPin, Star } from 'lucide-react'
import { ProductImage } from '@/components/shared/ProductImage'
import {
  formatVendorTime,
  isVendorAcceptingOrders,
} from '@/lib/vendor-hours'
import { useBranchStore } from '@/stores/branch-store'
import { cn } from '@/lib/utils'
import type { Vendor } from '@/types'

function formatRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : '—'
}

export function VendorCard({ vendor }: { vendor: Vendor }) {
  const branch = useBranchStore((s) =>
    s.branches.find((b) => b.id === vendor.branchId),
  )
  const accepting = isVendorAcceptingOrders(vendor)

  const cardInner = (
    <>
      <div className="relative">
        <ProductImage
          src={vendor.imageUrl}
          alt={vendor.name}
          className="aspect-[16/10]"
          imgClassName="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-deep/55 via-transparent to-transparent"
          aria-hidden
        />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-primary-deep shadow-sm backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          {formatRating(vendor.rating)}
        </span>
        {branch ? (
          <span className="absolute bottom-3 left-3 inline-flex max-w-[85%] items-center gap-1 rounded-full bg-primary-deep/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <MapPin className="h-3 w-3 shrink-0 text-lime" />
            <span className="truncate">{branch.name}</span>
          </span>
        ) : null}
        {!accepting ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted shadow-sm">
            Past cut-off
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-lg font-bold leading-snug transition-colors',
              accepting ? 'text-primary-deep group-hover:text-primary' : 'text-muted',
            )}
          >
            {vendor.name}
          </h3>
          {accepting ? (
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-medium text-muted">{vendor.location}</p>
        <p className="mt-3 line-clamp-2 text-sm text-ink/70">{vendor.description}</p>
        <p className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-primary">
          <Clock className="h-3.5 w-3.5" />
          Orders until {formatVendorTime(vendor.cutoffTime)}
        </p>
      </div>
    </>
  )

  const base =
    'flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]'

  if (!accepting) {
    return (
      <div className={cn(base, 'opacity-70 grayscale-[0.35]')} aria-disabled>
        {cardInner}
      </div>
    )
  }

  return (
    <Link
      to={`/customer/stores/${vendor.id}`}
      className={cn(base, 'group hover-lift')}
    >
      {cardInner}
    </Link>
  )
}
