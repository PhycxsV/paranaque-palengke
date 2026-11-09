import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { FeedbackSummary } from '@/stores/feedback-store'
import type { VendorFeedback } from '@/types'

/** Read-only stars. Supports fractional values (e.g. 4.3) by clipping the filled layer. */
export function StarRating({
  value,
  className,
  starClassName,
}: {
  value: number
  className?: string
  starClassName?: string
}) {
  const pct = Math.max(0, Math.min(5, value)) * 20
  const row = (filled: boolean) => (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4 shrink-0',
            filled ? 'fill-gold text-gold' : 'text-border',
            starClassName,
          )}
        />
      ))}
    </span>
  )
  return (
    <span
      className={cn('relative inline-flex', className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {row(false)}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        {row(true)}
      </span>
    </span>
  )
}

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

/** Tap-to-rate stars with large touch targets. */
export function StarInput({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (value: number) => void
  className?: string
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="radiogroup"
        aria-label="Rating"
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-lg p-1 transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Star
              className={cn(
                'h-9 w-9 transition',
                n <= shown ? 'fill-gold text-gold' : 'text-border',
              )}
            />
          </button>
        ))}
      </div>
      <p className="h-4 text-xs font-bold text-primary-deep">
        {shown ? RATING_WORDS[shown] : 'Tap a star to rate'}
      </p>
    </div>
  )
}

/** Average + 5-to-1 star distribution bars. */
export function RatingSummary({
  summary,
  className,
}: {
  summary: FeedbackSummary
  className?: string
}) {
  const max = Math.max(1, ...summary.distribution)
  return (
    <div className={cn('flex flex-col gap-5 sm:flex-row sm:items-center', className)}>
      <div className="shrink-0 text-center sm:w-36">
        <p className="font-display text-5xl font-extrabold leading-none text-primary-deep">
          {summary.count ? summary.average.toFixed(1) : '–'}
        </p>
        <StarRating
          value={summary.average}
          className="mt-2 justify-center"
          starClassName="h-4 w-4"
        />
        <p className="mt-1.5 text-xs font-semibold text-muted">
          {summary.count} review{summary.count === 1 ? '' : 's'}
        </p>
      </div>
      <ul className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.distribution[stars - 1]
          return (
            <li key={stars} className="flex items-center gap-2.5 text-xs">
              <span className="flex w-6 shrink-0 items-center gap-0.5 font-bold text-primary-deep">
                {stars}
                <Star className="h-3 w-3 fill-gold text-gold" />
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-primary-100">
                <span
                  className="block h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="w-5 shrink-0 text-right font-semibold text-muted">
                {count}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  )
}

/** One customer review. Pass `vendorName` to show who it is about (admin view). */
export function FeedbackCard({
  item,
  vendorName,
}: {
  item: VendorFeedback
  vendorName?: string
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-deep">
          {initials(item.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="truncate text-sm font-bold text-primary-deep">
              {item.customerName}
            </p>
            <StarRating value={item.rating} starClassName="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-muted">
            {vendorName ? `${vendorName} · ` : ''}
            {formatDateTime(item.createdAt)}
            {item.orderId ? (
              <>
                {' · '}
                <span className="font-mono">{item.orderId}</span>
              </>
            ) : null}
          </p>
          {item.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-ink/85">{item.comment}</p>
          ) : (
            <p className="mt-2 text-sm italic text-muted">No comment left.</p>
          )}
        </div>
      </div>
    </li>
  )
}
