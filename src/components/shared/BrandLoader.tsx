import { LOGOS } from '@/lib/assets'
import { cn } from '@/lib/utils'

/**
 * Loading screen: the Parañaque seal with a ring that spins around its edge.
 * `fullScreen` fills the viewport (app start); otherwise it fills a section.
 */
export function BrandLoader({
  fullScreen = false,
  label = 'Loading',
}: {
  fullScreen?: boolean
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center bg-warm-white',
        fullScreen ? 'min-h-screen' : 'min-h-[40vh]',
      )}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-4 border-primary/15"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary"
        />
        <img
          src={LOGOS.citySeal}
          alt=""
          className="h-20 w-20 object-contain"
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
