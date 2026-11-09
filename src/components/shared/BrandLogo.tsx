import { BRAND_NAME } from '@/constants'
import { LOGOS } from '@/lib/assets'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  /** `onDark` renders white text for sidebars / footer. */
  tone?: 'onLight' | 'onDark'
  subtitle?: string
  className?: string
  sealClassName?: string
}

/** City seal + "Palengke mo, Keri ko" wordmark lockup. */
export function BrandMark({
  tone = 'onLight',
  subtitle,
  className,
  sealClassName,
}: BrandMarkProps) {
  const dark = tone === 'onDark'
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <img
        src={LOGOS.citySeal}
        alt="City of Parañaque seal"
        className={cn(
          'h-11 w-11 shrink-0 object-contain drop-shadow-[0_2px_6px_rgb(0_0_0/0.25)]',
          sealClassName,
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'font-display truncate text-lg font-extrabold leading-tight tracking-tight',
            dark ? 'text-white' : 'text-primary-deep',
          )}
        >
          {BRAND_NAME}
        </p>
        {subtitle ? (
          <p
            className={cn(
              'truncate text-[10px] font-semibold uppercase tracking-[0.16em]',
              dark ? 'text-lime' : 'text-muted',
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const PARTNERS = [
  { src: LOGOS.citySeal, alt: 'City of Parañaque seal', className: 'h-14 sm:h-16' },
  {
    src: LOGOS.bagongParanaque,
    alt: 'Bagong Parañaque — Serbisyo Lang po',
    className: 'h-14 sm:h-16',
  },
  {
    src: LOGOS.megaCity,
    alt: 'Parañaque — A Mega City by the Bay',
    className: 'h-12 sm:h-14',
  },
  { src: LOGOS.helpCard, alt: 'hELP Citizen Card', className: 'h-9 sm:h-11' },
] as const

/** Row of the four official Parañaque marks. */
export function PartnerLogos({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14',
        className,
      )}
    >
      {PARTNERS.map((logo) => (
        <li key={logo.alt} className="flex items-center">
          <img
            src={logo.src}
            alt={logo.alt}
            loading="lazy"
            className={cn('w-auto object-contain', logo.className)}
          />
        </li>
      ))}
    </ul>
  )
}
