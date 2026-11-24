import { VendorCard } from '@/components/shared/VendorCard'
import { cn } from '@/lib/utils'
import type { Vendor } from '@/types'

/** Seconds for one full loop of the vendor strip. */
const LOOP_SECONDS = 45

export function VendorCarousel({ vendors }: { vendors: Vendor[] }) {
  if (vendors.length === 0) return null

  // Duplicate the strip so the CSS loop can scroll seamlessly.
  const strip = [...vendors, ...vendors]

  return (
    <div
      className="group/carousel relative -mx-4 overflow-hidden sm:-mx-6"
      role="region"
      aria-label="Vendor carousel"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-warm-white to-transparent sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-warm-white to-transparent sm:w-16"
        aria-hidden
      />

      <div
        className={cn(
          'flex w-max gap-6 px-4 py-1 sm:px-6',
          'animate-vendor-marquee motion-reduce:animate-none',
          'group-hover/carousel:[animation-play-state:paused]',
          'group-focus-within/carousel:[animation-play-state:paused]',
        )}
        style={{ animationDuration: `${Math.max(LOOP_SECONDS, vendors.length * 6)}s` }}
      >
        {strip.map((vendor, index) => (
          <div
            key={`${vendor.id}-${index}`}
            className="w-[min(100vw-3rem,18.5rem)] shrink-0 sm:w-[20rem]"
            aria-hidden={index >= vendors.length}
          >
            <VendorCard vendor={vendor} />
          </div>
        ))}
      </div>
    </div>
  )
}
