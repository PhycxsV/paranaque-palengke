import { Link } from 'react-router-dom'
import { BRAND_TAGLINE, FEATURE_TAWAD_ENABLED } from '@/constants'
import { BrandMark, PartnerLogos } from '@/components/shared/BrandLogo'

const linkClass = 'transition-colors hover:text-lime'

export function CustomerFooter() {
  return (
    <footer className="mt-auto">
      <div className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
          <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            Parañaque City initiatives
          </p>
          <PartnerLogos />
        </div>
      </div>

      <div className="relative overflow-hidden bg-primary-deep text-white">
        <span className="brand-ribbon absolute inset-x-0 top-0 h-1" aria-hidden />
        <span
          className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-lime/10 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-bay/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <BrandMark tone="onDark" subtitle="Lungsod ng Parañaque" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              {BRAND_TAGLINE} A frontend-only marketplace prototype inspired by
              Parañaque&apos;s civic identity. Demo vendors are fictional.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/customer/products" className={linkClass}>
                  Browse products
                </Link>
              </li>
              <li>
                <Link to="/customer/vendors" className={linkClass}>
                  Meet the vendors
                </Link>
              </li>
              <li>
                <Link to="/customer/orders" className={linkClass}>
                  My orders
                </Link>
              </li>
              {FEATURE_TAWAD_ENABLED ? (
                <li>
                  <Link to="/customer/offers" className={linkClass}>
                    My offers
                  </Link>
                </li>
              ) : null}
              <li>
                <Link to="/vendor" className={linkClass}>
                  Vendor portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className={linkClass}>
                  LGU Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">
              Prototype notes
            </p>
            <p className="mt-4 rounded-xl bg-white/8 p-4 text-sm leading-relaxed text-white/80 ring-1 ring-white/10">
              No real payments, delivery, or government endorsement. QR payment
              is simulated for demonstration only.
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Palengke mo, Keri ko — Frontend prototype
        </div>
      </div>
    </footer>
  )
}
